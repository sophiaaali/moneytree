package edu.brown.cs.student.mocks;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/** MockStorage is a mock implementation of StorageInterface for testing purposes. */
public class MockStorage implements StorageInterface {

  private final Map<String, Map<String, Map<String, Object>>> storage;

  public MockStorage() {
    this.storage = new HashMap<>();
  }

  @Override
  public void addDocument(String collectionId, String documentId, Map<String, Object> data) {
    storage.computeIfAbsent(collectionId, k -> new HashMap<>()).put(documentId, data);
  }

  @Override
  public List<Map<String, Object>> getCollection(String collectionId)
      throws InterruptedException, ExecutionException {
    if (storage.containsKey(collectionId)) {
      return new ArrayList<>(storage.get(collectionId).values());
    } else {
      return new ArrayList<>();
    }
  }

  @Override
  public void clearCollection(String collectionId) throws InterruptedException, ExecutionException {
    storage.remove(collectionId);
  }

  @Override
  public void deleteDocument(String collectionId, String documentId) {
    // Check if the collection exists in the storage
    if (storage.containsKey(collectionId)) {
      // Check if the document exists in the collection
      Map<String, Map<String, Object>> collection = storage.get(collectionId);
      if (collection.containsKey(documentId)) {
        collection.remove(documentId); // Remove the document from the collection
        // If the collection becomes empty, remove the collection from storage
        if (collection.isEmpty()) {
          storage.remove(collectionId);
        }
      }
    }
  }

  /**
   * Retrieves a document by its ID from the given collection.
   *
   * @param collectionId The collection name.
   * @param documentId The document ID.
   * @return The document data if it exists, otherwise null.
   */
  public Map<String, Object> getDocument(String collectionId, String documentId) {
    if (storage.containsKey(collectionId) && storage.get(collectionId).containsKey(documentId)) {
      return storage.get(collectionId).get(documentId);
    } else {
      return null;
    }
  }

  /**
   * Checks if a document exists in the storage.
   *
   * @param collectionId The collection name.
   * @param documentId The document ID.
   * @return True if the document exists, false otherwise.
   */
  public boolean documentExists(String collectionId, String documentId) {
    return storage.containsKey(collectionId) && storage.get(collectionId).containsKey(documentId);
  }
}
