package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.AddHandler;
import edu.brown.cs.student.mocks.MockStorage;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import okio.Buffer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import spark.Spark;

public class AddHandlerTest {
  private static MockStorage mockStorage;
  private static JsonAdapter<Map<String, Object>> adapter;
  private static final Type mapStringObjectType =
      Types.newParameterizedType(Map.class, String.class, Object.class);

  @BeforeAll
  public static void setupOnce() {
    Spark.stop();
    Spark.awaitStop();
    Spark.port(0);
  }

  @BeforeEach
  public void setup() {
    mockStorage = new MockStorage();
    Spark.get("/add", new AddHandler(mockStorage));
    Spark.awaitInitialization();

    Moshi moshi = new Moshi.Builder().build();
    adapter = moshi.adapter(mapStringObjectType);
  }

  @AfterEach
  public void tearDown() {
    try {
      mockStorage.clearCollection("user-1");
      mockStorage.clearCollection("user-2");
      Spark.unmap("/add");
      Spark.awaitStop();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  /**
   * Helper to start a connection to a specific API endpoint/params
   *
   * @param apiCall the call string, including endpoint
   * @return the connection for the given URL, just after connecting
   * @throws IOException if the connection fails for some reason
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
  public void testAddSuccess() throws Exception {
    HttpURLConnection connection =
        tryRequest("add?user=1&category=clothes&budget=10&duration=30&spent=5&plant=orchid");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("clothes", responseBody.get("category"));
    assertEquals("10", responseBody.get("budget"));
    assertEquals("30", responseBody.get("duration"));
    assertEquals("5", responseBody.get("spent"));
    assertEquals("orchid", responseBody.get("plant"));
    assertNotNull(responseBody.get("time"));

    // Verify that the data was added to MockStorage
    assertEquals(1, mockStorage.getCollection("user-1").size());
    Map<String, Object> storedBudget = mockStorage.getCollection("user-1").get(0);
    assertEquals("clothes", storedBudget.get("category"));
    assertEquals("10", storedBudget.get("budget"));

    connection.disconnect();
  }

  @Test
  public void testAddSeveralSuccess() throws Exception {
    // Add the first user's data
    HttpURLConnection connection =
        tryRequest("add?user=1&category=clothes&budget=10&duration=30&spent=5&plant=orchid");
    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("clothes", responseBody.get("category"));
    assertEquals("10", responseBody.get("budget"));
    assertEquals("30", responseBody.get("duration"));
    assertEquals("5", responseBody.get("spent"));
    assertEquals("orchid", responseBody.get("plant"));
    assertNotNull(responseBody.get("time"));

    // Verify that the data was added to MockStorage
    assertEquals(1, mockStorage.getCollection("user-1").size());
    Map<String, Object> storedBudget = mockStorage.getCollection("user-1").get(0);
    assertEquals("clothes", storedBudget.get("category"));
    assertEquals("10", storedBudget.get("budget"));

    connection.disconnect();

    // Add the second user's data
    connection = tryRequest("add?user=2&category=food&budget=10&duration=30&spent=5&plant=grass");
    assertEquals(200, connection.getResponseCode());
    responseBody = adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("2", responseBody.get("user"));
    assertEquals("food", responseBody.get("category"));
    assertEquals("10", responseBody.get("budget"));
    assertEquals("30", responseBody.get("duration"));
    assertEquals("5", responseBody.get("spent"));
    assertEquals("grass", responseBody.get("plant"));
    assertNotNull(responseBody.get("time"));

    // Verify that the data was added to MockStorage
    assertEquals(1, mockStorage.getCollection("user-2").size());
    storedBudget = mockStorage.getCollection("user-2").get(0);
    assertEquals("food", storedBudget.get("category"));
    assertEquals("10", storedBudget.get("budget"));

    connection.disconnect();

    // Add another entry to the first user's data
    connection =
        tryRequest("add?user=1&category=transportation&budget=10&duration=30&spent=5&plant=tree");
    assertEquals(200, connection.getResponseCode());
    responseBody = adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("transportation", responseBody.get("category"));
    assertEquals("10", responseBody.get("budget"));
    assertEquals("30", responseBody.get("duration"));
    assertEquals("5", responseBody.get("spent"));
    assertEquals("tree", responseBody.get("plant"));
    assertNotNull(responseBody.get("time"));

    // Verify that the data was added to MockStorage
    assertEquals(2, mockStorage.getCollection("user-1").size());
    storedBudget = mockStorage.getCollection("user-1").get(0);
    assertEquals("transportation", storedBudget.get("category"));
    assertEquals("10", storedBudget.get("budget"));

    connection.disconnect();
  }

  @Test
  public void testAddMissingParams() throws Exception {
    HttpURLConnection connection = tryRequest("add?budget=10");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals(
        "Missing category, budget, duration, spent, or plant parameters.",
        responseBody.get("error"));

    connection.disconnect();
  }

  @Test
  public void testStorageExceptionHandling() throws IOException {
    // Create a mock storage that throws a RuntimeException when addDocument is called
    MockStorage failingStorage =
        new MockStorage() {
          @Override
          public void addDocument(String collection_id, String doc_id, Map<String, Object> data) {
            throw new RuntimeException("Storage failure");
          }
        };

    // Set up a failing handler with the mock storage
    AddHandler failingHandler = new AddHandler(failingStorage);
    Spark.get("/failing-add", failingHandler);
    Spark.awaitInitialization();

    // Make a request and verify the response handles the exception gracefully
    HttpURLConnection connection =
        tryRequest(
            "failing-add?user=2&category=clothes&budget=10&duration=30&spent=5&plant=orchid");
    assertEquals(200, connection.getResponseCode()); // Ensure connection response is OK

    // Parse the response body
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Check that the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Storage failure", responseBody.get("error"));

    // Disconnect after assertions
    connection.disconnect();
  }
}
