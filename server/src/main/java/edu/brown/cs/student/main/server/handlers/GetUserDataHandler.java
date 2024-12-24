package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import spark.Request;
import spark.Response;
import spark.Route;

public class GetUserDataHandler implements Route {

  public StorageInterface storageHandler;

  public GetUserDataHandler(StorageInterface storageHandler) {
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
      String user = request.queryParams("user");
      String userId = "user-" + user;

      List<Map<String, Object>> data = this.storageHandler.getCollection(userId);
      List<Map<String, Object>> dataFormatted =
          data.stream()
              .map(
                  budget -> {
                    Map<String, Object> res = new HashMap<>();
                    res.put("category", budget.get("category"));
                    res.put("budget", budget.get("budget"));
                    res.put("duration", budget.get("duration"));
                    res.put("spent", budget.get("spent"));
                    res.put("plant", budget.get("plant"));
                    res.put("notes", budget.get("notes"));
                    return res;
                  })
              .collect(Collectors.toList());

      responseMap.put("response_type", "success");
      responseMap.put("data", dataFormatted);
    } catch (Exception e) {
      // error likely occurred in the storage handler
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
