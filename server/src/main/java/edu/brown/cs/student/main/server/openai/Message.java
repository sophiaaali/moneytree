package edu.brown.cs.student.main.server.openai;

public class Message {
  private String role; // "system", "user", or "assistant"
  private String content;

  public Message(String role, String content) {
    this.role = role;
    this.content = content;
  }

  public String getContent() {
    return this.content;
  }
}
