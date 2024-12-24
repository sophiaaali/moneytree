package edu.brown.cs.student.main.server.openai;

import java.util.List;

public class OpenAIRequest {
  private String model;
  private List<Message> messages;
  private int max_tokens;

  public OpenAIRequest(String model, List<Message> messages, int maxTokens) {
    this.model = model;
    this.messages = messages;
    this.max_tokens = maxTokens;
  }
}
