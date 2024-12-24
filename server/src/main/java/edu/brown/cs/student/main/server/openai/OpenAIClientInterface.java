package edu.brown.cs.student.main.server.openai;

import java.io.IOException;

public interface OpenAIClientInterface {

  String generateSuggestion(String prompt) throws IOException;
}
