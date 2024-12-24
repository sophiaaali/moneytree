import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import alivePlant from "./plants/plant_alive.png";
import deadPlant from "./plants/plant_dead.png";
import wiltPlant from "./plants/plant_wilted.png";
import aliveWillowTree from "./plants/willowtree_alive.png";
import deadWillowTree from "./plants/willowtree_dead.png";
import wiltWillowTree from "./plants/willowtree_wilted.png";
import aliveMoneyTree from "./plants/moneytree_alive.png";
import deadMoneyTree from "./plants/moneytree_dead.png";
import wiltMoneyTree from "./plants/moneytree_wilted.png";
import aliveMapleTree from "./plants/mapletree_alive.png";
import deadMapleTree from "./plants/mapletree_dead.png";
import wiltMapleTree from "./plants/mapletree_wilted.png";
import aliveCherryBlossomTree from "./plants/cherryblossomtree_alive.png";
import deadCherryBlossomTree from "./plants/cherryblossomtree_dead.png";
import wiltCherryBlossomTree from "./plants/cherryblossomtree_wilted.png";
import aliveLemonTree from "./plants/lemontree_alive.png";
import deadLemonTree from "./plants/lemontree_dead.png";
import wiltLemonTree from "./plants/lemontree_wilted.png";
import aliveOrchid from "./plants/orchid_alive.png";
import deadOrchid from "./plants/orchid_dead.png";
import wiltOrchid from "./plants/orchid_wilted.png";
import {
  getUserData,
  updateSpentAmount,
  deleteBudgetEntry,
} from "../utils/api";
import "../styles/Garden.css";

interface Plant {
  id: number;
  category: string;
  plantType: string;
  state: "alive" | "dead" | "wilt";
  budget: number;
  spent: number;
}

interface GardenProps {
  userId: string;
}

const Garden: React.FC<GardenProps> = ({ userId }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [spentUpdate, setSpentUpdate] = useState<string>("");

  const openModal = (plant: Plant) => {
    setSelectedPlant(plant);
    setSpentUpdate("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPlant(null);
    setSpentUpdate("");
    setIsModalOpen(false);
  };

  const getPlantImage = (plantType: string, state: string) => {
    // Select the image based on the plant type and its state

    switch (plantType) {
      case "willow tree":
        return state === "alive"
          ? aliveWillowTree
          : state === "wilt"
          ? wiltWillowTree
          : deadWillowTree;
      case "money tree":
        return state === "alive"
          ? aliveMoneyTree
          : state === "wilt"
          ? wiltMoneyTree
          : deadMoneyTree;
      case "maple tree":
        return state === "alive"
          ? aliveMapleTree
          : state === "wilt"
          ? wiltMapleTree
          : deadMapleTree;
      case "cherry blossom tree":
        return state === "alive"
          ? aliveCherryBlossomTree
          : state === "wilt"
          ? wiltCherryBlossomTree
          : deadCherryBlossomTree;
      case "lemon tree":
        return state === "alive"
          ? aliveLemonTree
          : state === "wilt"
          ? wiltLemonTree
          : deadLemonTree;
      case "orchid":
        return state === "alive"
          ? aliveOrchid
          : state === "wilt"
          ? wiltOrchid
          : deadOrchid;
      default:
        return state === "alive"
          ? alivePlant
          : state === "wilt"
          ? wiltPlant
          : deadPlant;
    }
  };

  const getProgressBarColor = (state: string) => {
    switch (state) {
      case "alive":
        return "#3A833B"; // Green
      case "wilt":
        return "#E6AC00"; // Yellow
      case "dead":
        return "#E63946"; // Red
      default:
        return "#ccc"; // Default color
    }
  };

  const updatePlantState = (budget: number, spent: number) => {
    const percentageSpent = (spent / budget) * 100;
    if (percentageSpent >= 100) {
      return "dead"; // If spent is equal to or greater than budget
    } else if (percentageSpent > 50) {
      return "wilt"; // If spent is more than 50% of the budget
    } else {
      return "alive"; // If spent is less than 50% of the budget
    }
  };

  const handleUpdateSpent = async () => {
    if (!selectedPlant || !spentUpdate.trim()) return;

    const updatedSpent =
      parseFloat(selectedPlant.spent.toString()) + parseFloat(spentUpdate);

    if (updatedSpent < 0) {
      alert("Invalid amount.");
      return;
    }

    try {
      await updateSpentAmount(userId, selectedPlant.category, spentUpdate);
      setPlants((prevPlants) =>
        prevPlants.map((plant) =>
          plant.category === selectedPlant.category
            ? {
                ...plant,
                spent: updatedSpent,
                state: updatePlantState(plant.budget, updatedSpent),
              }
            : plant
        )
      );
      closeModal();
    } catch (error) {
      console.error("Failed to update spending:", error);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedPlant) return;

    try {
      await deleteBudgetEntry(userId, selectedPlant.category);
      setPlants((prevPlants) =>
        prevPlants.filter((plant) => plant.category !== selectedPlant.category)
      );
      closeModal();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const userData = await getUserData(userId);

        if (!isMounted) return;

        if (!userData || !userData.data) {
          throw new Error("No data received from server");
        }

        const formattedPlants = userData.data.map(
          (entry: any, index: number) => {
            const budget = parseFloat(entry.budget);
            const spent = parseFloat(entry.spent);

            return {
              id: index + 1,
              category: entry.category,
              plantType: entry.plant,
              state: updatePlantState(budget, spent),
              budget: budget,
              spent: spent,
            };
          }
        );

        setPlants(formattedPlants);
      } catch (err) {
        if (isMounted) {
          setError("Failed to load garden data. Please try again later.");
          console.error("Error fetching garden data:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="loading-container">
        🌱 Stay tuned, your garden is loading... 🌱
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="garden-container">
      <h2 className="garden-title">🌱 your garden 🌱</h2>
      {plants.length === 0 ? (
        <div className="empty-garden-message">
          no plants in your garden yet... start by creating a budget!
        </div>
      ) : (
        <div className="plants-grid">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="plant-card"
              onClick={() => openModal(plant)}
            >
              <img
                src={getPlantImage(plant.plantType, plant.state)}
                alt={`${plant.category} plant`}
                className="plant-image"
              />
              <h3 className="plant-category">{plant.category}</h3>
              <p className="plant-budget">
                ${plant.spent} / ${plant.budget}
              </p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min(
                      (plant.spent / plant.budget) * 100,
                      100
                    )}%`,
                    backgroundColor: getProgressBarColor(plant.state),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Manage Plant Budget"
        ariaHideApp={false} // Disable this if using React.StrictMode
        className="modal"
      >
        {selectedPlant && (
          <div className="modal-content">
            <h2>Manage: {selectedPlant.category}</h2>
            <p>Budget: ${selectedPlant.budget}</p>
            <p>Spent: ${selectedPlant.spent}</p>
            <input
              type="number"
              value={spentUpdate}
              onChange={(e) => setSpentUpdate(e.target.value)}
              placeholder="Update spending"
              className="update-spending"
            />
            <div className="modal-actions">
              <button onClick={handleUpdateSpent} className="update-btn">
                Update Spending
              </button>
              <button onClick={handleDeleteBudget} className="delete-btn">
                Delete Budget
              </button>
              <button onClick={closeModal} className="close-btn">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Garden;
