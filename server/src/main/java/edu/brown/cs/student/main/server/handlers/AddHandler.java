package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class AddHandler implements Route {

  public StorageInterface storageHandler;

  public AddHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  /**
   * Invoked when a request is made on this route's corresponding path e.g. '/hello'
   *
   * @param request The request object providing information about the HTTP request
   * @param response The response object providing functionality for modifying the response
   * @return The content to be set in the response
   */
  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      // Collect parameters from the request
      String user = request.queryParams("user");
      String category = request.queryParams("category");
      String budget = request.queryParams("budget");
      String duration = request.queryParams("duration");
      String spent = request.queryParams("spent");
      String plant = request.queryParams("plant");
      String notes = request.queryParams("notes");

      String time = LocalDateTime.now().toString();
      String userId = "user-" + user;
      String docId = "doc-" + category;

      // Error if latitude or longitude are empty
      if (user == null
          || category == null
          || budget == null
          || duration == null
          || spent == null
          || plant == null) {
        responseMap.put("response_type", "failure");
        responseMap.put("error", "Missing category, budget, duration, spent, or plant parameters.");
        return Utils.toMoshiJson(responseMap);
      }

      Map<String, Object> data = new HashMap<>();
      data.put("user", user);
      data.put("category", category);
      data.put("budget", budget);
      data.put("duration", duration);
      data.put("spent", spent);
      data.put("plant", plant);
      data.put("time", time);
      data.put("notes", notes);

      // Add the document to Firestore in the user's collection
      storageHandler.addDocument(userId, docId, data);

      responseMap.put("response_type", "success");
      responseMap.put("user", user);
      responseMap.put("category", category);
      responseMap.put("budget", budget);
      responseMap.put("duration", duration);
      responseMap.put("spent", spent);
      responseMap.put("plant", plant);
      responseMap.put("time", time);
      responseMap.put("notes", notes);
    } catch (Exception e) {
      // error likely occurred in the storage handler
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
