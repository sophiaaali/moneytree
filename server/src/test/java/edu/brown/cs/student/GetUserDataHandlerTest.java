package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.GetUserDataHandler;
import edu.brown.cs.student.mocks.MockStorage;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import okio.Buffer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import spark.Spark;

public class GetUserDataHandlerTest {
  private static MockStorage mockStorage;
  private static JsonAdapter<Map<String, Object>> adapter;
  private static final Type mapStringObjectType =
      Types.newParameterizedType(Map.class, String.class, Object.class);

  @BeforeAll
  public static void setupOnce() {
    Spark.stop();
    Spark.awaitStop();
    Spark.port(0); // Assign an arbitrary free port
  }

  @BeforeEach
  public void setup() {
    mockStorage = new MockStorage();
    Spark.get("/get-user-data", new GetUserDataHandler(mockStorage));
    Spark.awaitInitialization();

    Moshi moshi = new Moshi.Builder().build();
    adapter = moshi.adapter(mapStringObjectType);
  }

  @AfterEach
  public void tearDown() {
    try {
      mockStorage.clearCollection("user-1");
      Spark.unmap("/get-user-data");
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
  public void testGetUserDataSuccess() throws Exception {
    // Prepopulate MockStorage with sample data
    Map<String, Object> budget1 = new HashMap<>();
    budget1.put("category", "clothes");
    budget1.put("budget", "10");
    budget1.put("duration", "30");
    budget1.put("spent", "5");
    budget1.put("plant", "orchid");

    Map<String, Object> budget2 = new HashMap<>();
    budget2.put("category", "transportation");
    budget2.put("budget", "10");
    budget2.put("duration", "30");
    budget2.put("spent", "5");
    budget2.put("plant", "tree");

    mockStorage.addDocument("user-1", "doc-clothes", budget1);
    mockStorage.addDocument("user-1", "doc-transportation", budget2);

    // Send a request to the handler
    HttpURLConnection connection = tryRequest("get-user-data?user=1");

    assertEquals(200, connection.getResponseCode());

    // Parse the response
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));

    // Validate the response data
    List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
    assertEquals(2, data.size());

    Map<String, Object> retrievedEntry1 = data.get(0);
    assertEquals("transportation", retrievedEntry1.get("category"));
    assertEquals("10", retrievedEntry1.get("budget"));

    Map<String, Object> retrievedEntry2 = data.get(1);
    assertEquals("clothes", retrievedEntry2.get("category"));
    assertEquals("10", retrievedEntry2.get("budget"));

    connection.disconnect();
  }

  @Test
  public void testGetMultipleUsersDataSuccess() throws Exception {
    // Prepopulate MockStorage with sample data
    Map<String, Object> budget1 = new HashMap<>();
    budget1.put("category", "clothes");
    budget1.put("budget", "10");
    budget1.put("duration", "30");
    budget1.put("spent", "5");
    budget1.put("plant", "orchid");

    Map<String, Object> budget2 = new HashMap<>();
    budget2.put("category", "transportation");
    budget2.put("budget", "10");
    budget2.put("duration", "30");
    budget2.put("spent", "5");
    budget2.put("plant", "tree");

    mockStorage.addDocument("user-1", "doc-clothes", budget1);
    mockStorage.addDocument("user-2", "doc-transportation", budget2);

    // Send a request to the handler for user 1
    HttpURLConnection connection = tryRequest("get-user-data?user=1");

    assertEquals(200, connection.getResponseCode());

    // Parse the response
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));

    // Validate the response data
    List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
    assertEquals(1, data.size());

    Map<String, Object> retrievedEntry1 = data.get(0);
    assertEquals("clothes", retrievedEntry1.get("category"));
    assertEquals("10", retrievedEntry1.get("budget"));

    connection.disconnect();

    // Send a request to the handler for user 2
    connection = tryRequest("get-user-data?user=2");

    assertEquals(200, connection.getResponseCode());

    // Parse the response
    responseBody = adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));

    // Validate the response data
    data = (List<Map<String, Object>>) responseBody.get("data");
    assertEquals(1, data.size());

    Map<String, Object> retrievedEntry2 = data.get(0);
    assertEquals("transportation", retrievedEntry2.get("category"));
    assertEquals("10", retrievedEntry2.get("budget"));

    connection.disconnect();
  }

  @Test
  public void testGetDataEmptyStorage() throws Exception {
    // Ensure MockStorage is empty
    assertEquals(0, mockStorage.getCollection("user-1").size());

    // Send a request to the handler
    HttpURLConnection connection = tryRequest("get-user-data?user=1");

    assertEquals(200, connection.getResponseCode());

    // Parse the response
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("success", responseBody.get("response_type"));

    // Validate that no data are returned
    List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
    assertEquals(0, data.size());

    connection.disconnect();
  }

  @Test
  public void testGetDataStorageFailure() throws Exception {
    // Create a failing MockStorage implementation
    MockStorage failingStorage =
        new MockStorage() {
          @Override
          public List<Map<String, Object>> getCollection(String collection_id) {
            throw new RuntimeException("Storage failure");
          }
        };

    // Set up the handler with the failing storage
    GetUserDataHandler failingHandler = new GetUserDataHandler(failingStorage);
    Spark.get("/failing-get-user-data", failingHandler);
    Spark.awaitInitialization();

    // Send a request to the handler
    HttpURLConnection connection = tryRequest("failing-get-user-data");

    assertEquals(200, connection.getResponseCode());

    // Parse the response
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Storage failure", responseBody.get("error"));

    connection.disconnect();
  }
}
