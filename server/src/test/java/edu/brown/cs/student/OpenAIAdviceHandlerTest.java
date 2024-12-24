package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.OpenAIAdviceHandler;
import edu.brown.cs.student.main.server.openai.OpenAIClientInterface;
import edu.brown.cs.student.mocks.MockOpenAIClient;
import edu.brown.cs.student.mocks.MockStorage;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import okio.Buffer;
import org.junit.jupiter.api.*;
import spark.Spark;

public class OpenAIAdviceHandlerTest {

  private static MockStorage mockStorage;
  private static MockOpenAIClient mockClient;
  private static JsonAdapter<Map<String, Object>> adapter;
  private static final Type mapStringObjectType =
      Types.newParameterizedType(Map.class, String.class, Object.class);

  @BeforeAll
  public static void setupOnce() {
    Spark.stop();
    Spark.awaitStop();
    Spark.port(0); // Allocate dynamic port
  }

  @BeforeEach
  public void setup() {
    mockStorage = new MockStorage();
    mockClient = new MockOpenAIClient();

    // Register the OpenAIAdviceHandler with Spark
    Spark.get("/advice", new OpenAIAdviceHandler(mockStorage, mockClient));
    Spark.awaitInitialization();

    // Set up Moshi for JSON deserialization
    Moshi moshi = new Moshi.Builder().build();
    adapter = moshi.adapter(mapStringObjectType);
  }

  @AfterEach
  public void tearDown() {
    try {
      mockStorage.clearCollection("user-1");
      Spark.unmap("/advice");
      Spark.awaitStop();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  /**
   * Helper method to make HTTP requests.
   *
   * @param apiCall Endpoint with query params
   * @return The HttpURLConnection for the request
   * @throws IOException if the request fails
   */
  private HttpURLConnection tryRequest(String apiCall) throws IOException {
    URL requestURL = new URL("http://localhost:" + Spark.port() + "/" + apiCall);
    HttpURLConnection clientConnection = (HttpURLConnection) requestURL.openConnection();
    clientConnection.setRequestProperty("Content-Type", "application/json");
    clientConnection.setRequestProperty("Accept", "application/json");
    clientConnection.connect();
    return clientConnection;
  }

  @Test
  public void testAdviceSuccess() throws Exception {
    // Add test data to mock storage
    Map<String, Object> budgetData = new HashMap<>();
    budgetData.put("category", "entertainment");
    budgetData.put("budget", "100");
    budgetData.put("spent", "70");
    mockStorage.addDocument("user-1", "doc-entertainment", budgetData);

    // Make the HTTP request to the handler
    HttpURLConnection connection = tryRequest("advice?user=1&goal=Save%20for%20vacation");
    assertEquals(200, connection.getResponseCode());

    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify response content
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("Mocked OpenAI response based on spending history.", responseBody.get("advice"));
    assertEquals("1", responseBody.get("user"));

    connection.disconnect();
  }

  @Test
  public void testAdviceMissingParameters() throws Exception {
    // Make request without a user parameter
    HttpURLConnection connection = tryRequest("advice?goal=Save%20for%20vacation");
    assertEquals(200, connection.getResponseCode());

    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify failure response
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("No user or goal provided", responseBody.get("error"));

    connection.disconnect();
  }

  @Test
  public void testAdviceNoHistory() throws Exception {
    // Request advice for user with no spending history
    HttpURLConnection connection = tryRequest("advice?user=1&goal=Save%20for%20vacation");
    assertEquals(200, connection.getResponseCode());

    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify success response with mocked OpenAI result
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("Mocked OpenAI response based on spending history.", responseBody.get("advice"));
    assertEquals("1", responseBody.get("user"));

    connection.disconnect();
  }

  @Test
  public void testStorageExceptionHandling() throws Exception {
    // Simulate storage exception by using a failing storage handler
    MockStorage failingStorage =
        new MockStorage() {
          @Override
          public java.util.List<Map<String, Object>> getCollection(String collectionId)
              throws InterruptedException {
            throw new RuntimeException("Storage failure");
          }
        };

    OpenAIClientInterface mockOpenAI = prompt -> "Mocked response";
    Spark.get("/failing-advice", new OpenAIAdviceHandler(failingStorage, mockOpenAI));
    Spark.awaitInitialization();

    HttpURLConnection connection = tryRequest("failing-advice?user=1&goal=Save%20for%20vacation");
    assertEquals(200, connection.getResponseCode());

    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify failure response due to storage error
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Storage failure", responseBody.get("error"));

    connection.disconnect();
  }
}
