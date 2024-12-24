package edu.brown.cs.student.main.server;

import static spark.Spark.after;

import edu.brown.cs.student.main.server.handlers.AddHandler;
import edu.brown.cs.student.main.server.handlers.DeleteHandler;
import edu.brown.cs.student.main.server.handlers.GetUserDataHandler;
import edu.brown.cs.student.main.server.handlers.OpenAIAdviceHandler;
import edu.brown.cs.student.main.server.handlers.OpenAISummaryHandler;
import edu.brown.cs.student.main.server.handlers.UpdateSpentHandler;
import edu.brown.cs.student.main.server.openai.OpenAIClient;
import edu.brown.cs.student.main.server.openai.OpenAIClientInterface;
import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.io.IOException;
import spark.Filter;
import spark.Spark;

/** Top Level class for our project, utilizes spark to create and maintain our server. */
public class Server {

  public static void setUpServer() {
    int port = 3232;
    Spark.port(port);

    after(
        (Filter)
            (request, response) -> {
              response.header("Access-Control-Allow-Origin", "*");
              response.header("Access-Control-Allow-Methods", "*");
            });

    StorageInterface firebaseUtils;
    OpenAIClientInterface openAIClient;
    try {
      firebaseUtils = new FirebaseUtilities();
      openAIClient = new OpenAIClient();

      Spark.get("add", new AddHandler(firebaseUtils));
      Spark.get("get-user-data", new GetUserDataHandler(firebaseUtils));
      Spark.get("delete", new DeleteHandler(firebaseUtils));
      Spark.get("update-spent", new UpdateSpentHandler(firebaseUtils));
      Spark.get("summary", new OpenAISummaryHandler(firebaseUtils, openAIClient));
      Spark.get("advice", new OpenAIAdviceHandler(firebaseUtils, openAIClient));

      Spark.notFound(
          (request, response) -> {
            response.status(404); // Not Found
            System.out.println("ERROR");
            return "404 Not Found - The requested endpoint does not exist.";
          });
      Spark.init();
      Spark.awaitInitialization();

      System.out.println("Server started at http://localhost:" + port);
    } catch (IOException e) {
      e.printStackTrace();
      System.err.println(
          "Error: Could not initialize Firebase. Likely due to firebase_config.json not being found. Exiting.");
      System.exit(1);
    }
  }

  /**
   * Runs Server.
   *
   * @param args none
   */
  public static void main(String[] args) {
    setUpServer();
  }
}
