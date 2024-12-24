import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import {
  addDataEntry,
  getUserData,
  deleteBudgetEntry,
  updateSpentAmount,
} from "../utils/api";
import "../styles/Budgets.css";

interface BudgetEntry {
  category: string;
  budget: number;
  duration: string;
  spent: number;
  plant: string;
  notes?: string;
}

interface BudgetProps {
  userId: string;
}

const Budget: React.FC<BudgetProps> = ({ userId }) => {
  const [formData, setFormData] = useState<BudgetEntry>({
    category: "",
    budget: 0,
    duration: "",
    spent: 0,
    plant: "",
    notes: "",
  });

  const [history, setHistory] = useState<BudgetEntry[]>([]);
  const [spentUpdateAmount, setSpentUpdateAmount] = useState<{
    [key: string]: string;
  }>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "budget" || name === "spent" ? Number(value) : value,
    }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formData.category.trim() || !formData.duration.trim()) {
      alert("Please fill in the required fields.");
      return;
    }

    if (formData.budget <= 0) {
      alert("Budget must be a positive number.");
      return;
    }

    if (formData.spent < 0) {
      alert("Spent amount cannot be negative.");
      return;
    }

    await addDataEntry(
      userId,
      formData.category,
      formData.budget.toString(),
      formData.duration,
      formData.spent.toString(),
      formData.plant,
      formData.notes || "None"
    );
    setHistory((prevHistory) => [{ ...formData }, ...prevHistory]);
    setFormData({
      category: "",
      budget: 0,
      duration: "",
      spent: 0,
      plant: "",
      notes: "",
    });
  }

  async function fetchUserData() {
    try {
      const userData = await getUserData(userId);
      const formattedData = userData.data.map(
        (entry: {
          category: string;
          budget: string;
          duration: string;
          spent: string;
          plant: string;
          notes: string;
        }) => ({
          category: entry.category,
          budget: parseFloat(entry.budget),
          duration: entry.duration,
          spent: parseFloat(entry.spent),
          plant: entry.plant,
          notes: entry.notes,
        })
      );
      setHistory(formattedData);
      return formattedData;
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleDelete = async (category: string) => {
    try {
      await deleteBudgetEntry(userId, category);
      setHistory((prevHistory) =>
        prevHistory.filter((entry) => entry.category !== category)
      );
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      alert("Failed to delete budget entry.");
    }
  };

  const handleUpdateSpent = async (category: string) => {
    const amount = spentUpdateAmount[category];
    const userData = await getUserData(userId);
    const currentAmount = userData.data.filter(
      (entry: any) => entry.category == category
    )[0].spent;

    if (!amount || parseFloat(currentAmount) + parseFloat(amount) < 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      await updateSpentAmount(userId, category, amount);

      // Update the `history` state locally
      setHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.category === category
            ? {
                ...entry,
                spent: entry.spent + parseFloat(amount), // Increment the spent amount
              }
            : entry
        )
      );

      // Reset the spent update amount for ALL categories
      setSpentUpdateAmount({});
    } catch (error) {
      console.error("Error updating spent amount:", error);
      alert("Failed to update spent amount.");
    }
  };

  const handleSpentAmountChange = (category: string, value: string) => {
    setSpentUpdateAmount((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  return (
    <div className="container">
      {/* History Section */}
      <div className="history-section">
        <h3> 🌱 manage my budgets 🌱</h3>
        {history.length === 0 ? (
          <p>
            no entries yet... start by creating your first budget on the right ➪
          </p>
        ) : (
          <ul className="history-list">
            {history.map((entry, index) => (
              <li key={index} className="history-item">
                <strong>Category:</strong> {entry.category} <br />
                <strong>Budget:</strong> {entry.budget} <br />
                <strong>Duration:</strong> {entry.duration} <br />
                <strong>Spent:</strong> {entry.spent || "0"} <br />
                <strong>Plant:</strong> {entry.plant || "N/A"} <br />
                <strong>Notes:</strong> {entry.notes || "None"}
                <div className="action-buttons">
                  <input
                    type="number"
                    value={spentUpdateAmount[entry.category] || ""}
                    onChange={(e) =>
                      handleSpentAmountChange(entry.category, e.target.value)
                    }
                    placeholder="Input amount spent..."
                  />
                  <button
                    className="update-btn"
                    onClick={() => handleUpdateSpent(entry.category)}
                  >
                    Update my spendings
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(entry.category)}
                  >
                    Delete entire budget
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Update Budget Section */}
      <div className="update-budget-section">
        <h3>🌱 set a new budget here 🌱</h3>
        <form className="update-budget-form" onSubmit={handleSubmit}>
          <label>
            budget category
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="category name"
              required
              className="input-select"
            />
          </label>
          <label>
            budget
            <input
              type="number"
              name="budget"
              value={formData.budget || ""}
              onChange={handleChange}
              placeholder="budget amount"
              required
              className="input-select"
            />
          </label>
          <label>
            duration
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="duration (e.g., monthly)"
              required
              className="input-select"
            />
          </label>
          <label>
            spent
            <input
              type="number"
              name="spent"
              value={formData.spent || ""}
              onChange={handleChange}
              placeholder="amount spent"
              className="input-select"
            />
          </label>
          <label>
            plant
            <select
              name="plant"
              value={formData.plant}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="">please select a plant</option>
              <option value="plant">plant</option>
              <option value="willow tree">willow tree</option>
              <option value="money tree">money tree</option>
              <option value="maple tree">maple tree</option>
              <option value="cherry blossom tree">cherry blossom tree</option>
              <option value="lemon tree">lemon tree</option>
              <option value="orchid">orchid</option>
            </select>
          </label>
          <label>
            notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="enter any notes about this budget category..."
              className="input-select"
            />
          </label>
          <button type="submit">save budget</button>
        </form>
      </div>
    </div>
  );
};

export default Budget;
