package edu.brown.cs.student.mocks;

import edu.brown.cs.student.main.server.openai.OpenAIClientInterface;
import java.io.IOException;

/** MockOpenAIClient is a mock implementation of OpenAIClientInterface for testing purposes. */
public class MockOpenAIClient implements OpenAIClientInterface {

  @Override
  public String generateSuggestion(String prompt) throws IOException {
    return "Mocked OpenAI response based on spending history.";
  }
}
