package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.openai.OpenAIClientInterface;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import spark.Request;
import spark.Response;
import spark.Route;

public class OpenAIAdviceHandler implements Route {

  public StorageInterface storageHandler;
  public OpenAIClientInterface openAIClient;

  public OpenAIAdviceHandler(StorageInterface storageHandler, OpenAIClientInterface openAIClient) {
    this.storageHandler = storageHandler;
    this.openAIClient = openAIClient;
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
      String goal = request.queryParams("goal");

      if (user == null || goal == null || goal.isEmpty()) {
        responseMap.put("response_type", "failure");
        responseMap.put("error", "No user or goal provided");
        return Utils.toMoshiJson(responseMap);
      }

      String prompt = createPrompt(user, goal);
      String advice = openAIClient.generateSuggestion(prompt);

      responseMap.put("response_type", "success");
      responseMap.put("user", user);
      responseMap.put("advice", advice);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }

  private String createPrompt(String user, String goal) throws Exception {
    String userId = "user-" + user;
    List<Map<String, Object>> data = this.storageHandler.getCollection(userId);
    List<Map<String, Object>> dataFormatted =
        data.stream()
            .map(
                budget -> {
                  Map<String, Object> res = new HashMap<>();
                  res.put("category", budget.get("category"));
                  res.put("budget", budget.get("budget"));
                  res.put("spent", budget.get("spent"));
                  return res;
                })
            .collect(Collectors.toList());
    String prompt =
        "Based on my financial goals, provide personalized budgeting and saving advice. "
            + "Consider practical steps, timeline, and potential challenges. Here is my spending history: "
            + dataFormatted
            + ". Here is my goal and priorities: "
            + goal;

    return prompt;
  }
}
