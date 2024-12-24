package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.DeleteHandler;
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

public class DeleteHandlerTest {

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
    Spark.get("/delete", new DeleteHandler(mockStorage));
    Spark.awaitInitialization();

    Moshi moshi = new Moshi.Builder().build();
    adapter = moshi.adapter(mapStringObjectType);

    // Add some test data to the storage
    mockStorage.addDocument(
        "user-1",
        "doc-clothes",
        Map.of("category", "clothes", "budget", "100", "duration", "30", "spent", "50"));
    mockStorage.addDocument(
        "user-1",
        "doc-food",
        Map.of("category", "food", "budget", "200", "duration", "60", "spent", "150"));
  }

  @AfterEach
  public void tearDown() {
    try {
      mockStorage.clearCollection("user-1");
      Spark.unmap("/delete");
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
  public void testDeleteSuccess() throws Exception {
    // Make a delete request
    HttpURLConnection connection = tryRequest("delete?user=1&category=clothes");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates success
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("clothes", responseBody.get("category"));

    // Verify that the document was deleted from the storage
    assertEquals(1, mockStorage.getCollection("user-1").size());
    assertEquals("food", mockStorage.getCollection("user-1").get(0).get("category"));

    connection.disconnect();
  }

  @Test
  public void testDeleteAllDocs() throws Exception {
    // Make a delete request for clothes
    HttpURLConnection connection = tryRequest("delete?user=1&category=clothes");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates success
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("clothes", responseBody.get("category"));

    // Verify that the document was deleted from the storage
    assertEquals(1, mockStorage.getCollection("user-1").size());
    assertEquals("food", mockStorage.getCollection("user-1").get(0).get("category"));

    connection.disconnect();

    // Make a delete request for food
    connection = tryRequest("delete?user=1&category=food");

    assertEquals(200, connection.getResponseCode());
    responseBody = adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates success
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("1", responseBody.get("user"));
    assertEquals("food", responseBody.get("category"));

    // Verify that the document was deleted from the storage
    assertEquals(0, mockStorage.getCollection("user-1").size());

    connection.disconnect();
  }

  @Test
  public void testDeleteNonexistentDocument() throws Exception {
    // Try to delete a document that doesn't exist. Nothing will delete.
    HttpURLConnection connection = tryRequest("delete?user=1&category=nonexistent");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("success", responseBody.get("response_type"));

    // Verify that no documents were removed
    assertEquals(2, mockStorage.getCollection("user-1").size());

    connection.disconnect();
  }

  @Test
  public void testDeleteMissingParams() throws Exception {
    // Try to delete with missing parameters
    HttpURLConnection connection = tryRequest("delete?user=1");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Missing user or category parameters.", responseBody.get("error"));

    connection.disconnect();
  }

  @Test
  public void testStorageExceptionHandling() throws Exception {
    // Create a mock storage that throws an exception
    MockStorage failingStorage =
        new MockStorage() {
          @Override
          public void deleteDocument(String collection_id, String doc_id) {
            throw new RuntimeException("Storage failure");
          }
        };

    // Set up a failing handler with the mock storage
    DeleteHandler failingHandler = new DeleteHandler(failingStorage);
    Spark.get("/failing-delete", failingHandler);
    Spark.awaitInitialization();

    // Make a request and verify the response handles the exception gracefully
    HttpURLConnection connection = tryRequest("failing-delete?user=1&category=clothes");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Storage failure", responseBody.get("error"));

    connection.disconnect();
  }
}
