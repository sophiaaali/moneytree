package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class UpdateSpentHandler implements Route {

  public StorageInterface storageHandler;

  public UpdateSpentHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      // Collect parameters from the request
      String user = request.queryParams("user");
      String category = request.queryParams("category");
      String amountSpent = request.queryParams("amount_spent");

      // Validate required parameters
      if (user == null || category == null || amountSpent == null) {
        responseMap.put("response_type", "failure");
        responseMap.put("error", "Missing user, category, or amount_spent parameters.");
        return Utils.toMoshiJson(responseMap);
      }

      String userId = "user-" + user;
      String docId = "doc-" + category;

      // Retrieve existing budget data
      List<Map<String, Object>> existingData = storageHandler.getCollection(userId);

      // Find the specific budget entry
      Map<String, Object> budgetEntry =
          existingData.stream()
              .filter(entry -> category.equals(entry.get("category")))
              .findFirst()
              .orElseThrow(() -> new Exception("Budget entry not found"));

      // Calculate new spent amount
      double currentSpent = Double.parseDouble(budgetEntry.get("spent").toString());
      double newSpentAmount = currentSpent + Double.parseDouble(amountSpent);

      // Prepare updated data
      Map<String, Object> updatedData = new HashMap<>(budgetEntry);
      updatedData.put("spent", String.valueOf(newSpentAmount));

      // Add the updated document to Firestore
      storageHandler.addDocument(userId, docId, updatedData);

      responseMap.put("response_type", "success");
      responseMap.put("category", category);
      responseMap.put("previous_spent", currentSpent);
      responseMap.put("new_spent", newSpentAmount);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
