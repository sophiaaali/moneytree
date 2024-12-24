package edu.brown.cs.student.main.server.storage;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public interface StorageInterface {

  void addDocument(String collection_id, String doc_id, Map<String, Object> data);

  List<Map<String, Object>> getCollection(String collection_id)
      throws InterruptedException, ExecutionException;

  void clearCollection(String collection_id) throws InterruptedException, ExecutionException;

  void deleteDocument(String collection_id, String doc_id);
}
