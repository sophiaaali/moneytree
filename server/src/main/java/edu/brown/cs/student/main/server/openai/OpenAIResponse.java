package edu.brown.cs.student.main.server.openai;

import java.util.List;

public class OpenAIResponse {
  private List<Choice> choices;

  public List<Choice> getChoices() {
    return choices;
  }

  public static class Choice {
    private Message message;

    public Message getMessage() {
      return message;
    }
  }
}
