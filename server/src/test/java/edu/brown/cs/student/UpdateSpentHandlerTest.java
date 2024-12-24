package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.UpdateSpentHandler;
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

public class UpdateSpentHandlerTest {
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
    Spark.get("/update_spent", new UpdateSpentHandler(mockStorage));
    Spark.awaitInitialization();

    Moshi moshi = new Moshi.Builder().build();
    adapter = moshi.adapter(mapStringObjectType);

    // Add initial data for testing
    mockStorage.addDocument(
        "user-1",
        "doc-food",
        Map.of("category", "food", "budget", "100", "duration", "30", "spent", "20"));
    mockStorage.addDocument(
        "user-1",
        "doc-clothes",
        Map.of("category", "clothes", "budget", "200", "duration", "60", "spent", "50"));
  }

  @AfterEach
  public void tearDown() {
    try {
      mockStorage.clearCollection("user-1");
      Spark.unmap("/update_spent");
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
  public void testUpdateSpentSuccess() throws Exception {
    // Update the spent amount for the "food" category
    HttpURLConnection connection = tryRequest("update_spent?user=1&category=food&amount_spent=30");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates success
    assertEquals("success", responseBody.get("response_type"));
    assertEquals("food", responseBody.get("category"));
    assertEquals("20.0", responseBody.get("previous_spent").toString());
    assertEquals("50.0", responseBody.get("new_spent").toString());

    // Verify the storage was updated
    Map<String, Object> updatedData = mockStorage.getDocument("user-1", "doc-food");
    assertNotNull(updatedData);
    assertEquals("50.0", updatedData.get("spent").toString());

    connection.disconnect();
  }

  @Test
  public void testUpdateSpentInvalidValue() throws Exception {
    // Update the spent amount for the "food" category
    HttpURLConnection connection =
        tryRequest("update_spent?user=1&category=food&amount_spent=food");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("For input string: \"food\"", responseBody.get("error"));

    connection.disconnect();
  }

  @Test
  public void testUpdateSpentNonexistentCategory() throws Exception {
    // Attempt to update a nonexistent category
    HttpURLConnection connection =
        tryRequest("update_spent?user=1&category=nonexistent&amount_spent=10");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Budget entry not found", responseBody.get("error"));

    connection.disconnect();
  }

  @Test
  public void testUpdateSpentMissingParams() throws Exception {
    // Attempt to update with missing parameters
    HttpURLConnection connection = tryRequest("update_spent?user=1&category=food");

    assertEquals(200, connection.getResponseCode());
    Map<String, Object> responseBody =
        adapter.fromJson(new Buffer().readFrom(connection.getInputStream()));

    // Verify the response indicates failure
    assertEquals("failure", responseBody.get("response_type"));
    assertEquals("Missing user, category, or amount_spent parameters.", responseBody.get("error"));

    connection.disconnect();
  }
}
