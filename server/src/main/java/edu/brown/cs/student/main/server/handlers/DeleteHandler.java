package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class DeleteHandler implements Route {

  public StorageInterface storageHandler;

  public DeleteHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      // Collect parameters from the request
      String user = request.queryParams("user");
      String category = request.queryParams("category");

      // Validate input parameters
      if (user == null || category == null) {
        responseMap.put("response_type", "failure");
        responseMap.put("error", "Missing user or category parameters.");
        return Utils.toMoshiJson(responseMap);
      }

      // Construct the collection and document IDs
      String userId = "user-" + user;
      String docId = "doc-" + category;

      storageHandler.deleteDocument(userId, docId);

      responseMap.put("response_type", "success");
      responseMap.put("user", user);
      responseMap.put("category", category);
    } catch (Exception e) {
      // Error handling
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
