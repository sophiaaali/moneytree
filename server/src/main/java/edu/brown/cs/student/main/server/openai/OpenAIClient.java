package edu.brown.cs.student.main.server.openai;

import com.squareup.moshi.*;
import io.github.cdimascio.dotenv.Dotenv;
import java.io.IOException;
import java.util.List;
import okhttp3.*;

public class OpenAIClient implements OpenAIClientInterface {

  private static String API_KEY = null;
  private static final String API_URL = "https://api.openai.com/v1/chat/completions";
  private final Moshi moshi = new Moshi.Builder().build();

  public OpenAIClient() {
    Dotenv dotenv = Dotenv.load();
    API_KEY = dotenv.get("OPENAI_API_KEY");
  }

  @Override
  public String generateSuggestion(String prompt) throws IOException {
    OkHttpClient client = new OkHttpClient();

    String context =
        "You are an expert in personal financial budgeting and advice. "
            + "Always respond with a single, clear, and concise paragraph in plain text. "
            + "Do not use markdown, lists, or any formatting. "
            + "Your response should be a standalone piece of advice, as the user will not reply.";

    // Create request object
    OpenAIRequest request =
        new OpenAIRequest(
            "gpt-4o-mini",
            List.of(new Message("system", context), new Message("user", prompt)),
            1024);

    // Serialize request to JSON
    JsonAdapter<OpenAIRequest> requestAdapter = moshi.adapter(OpenAIRequest.class);
    String jsonPayload = requestAdapter.toJson(request);

    // Build HTTP request
    RequestBody body = RequestBody.create(jsonPayload, MediaType.get("application/json"));
    Request httpRequest =
        new Request.Builder()
            .url(API_URL)
            .header("Authorization", "Bearer " + API_KEY)
            .post(body)
            .build();

    // Execute HTTP request and handle response
    try (Response response = client.newCall(httpRequest).execute()) {
      if (!response.isSuccessful()) {
        throw new IOException("Unexpected code " + response);
      }

      // Deserialize JSON response
      JsonAdapter<OpenAIResponse> responseAdapter = moshi.adapter(OpenAIResponse.class);
      OpenAIResponse openAIResponse = responseAdapter.fromJson(response.body().string());

      if (openAIResponse != null && !openAIResponse.getChoices().isEmpty()) {
        return openAIResponse.getChoices().get(0).getMessage().getContent().trim();
      } else {
        return "No suggestion available.";
      }
    }
  }
}
