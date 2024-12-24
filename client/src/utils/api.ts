import { getLoginCookie } from "./cookie";

const HOST = "http://localhost:3232";

async function queryAPI(
  endpoint: string,
  query_params: Record<string, string>
) {
  // query_params is a dictionary of key-value pairs that gets added to the URL as query parameters
  // e.g. { foo: "bar", hell: "o" } becomes "?foo=bar&hell=o"
  const paramsString = new URLSearchParams(query_params).toString();
  const url = `${HOST}/${endpoint}?${paramsString}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(response.status, response.statusText);
  }
  return response.json();
}

export async function addDataEntry(
  user: string,
  category: string,
  budget: string,
  duration: string,
  spent: string,
  plant: string,
  notes: string
) {
  return await queryAPI("add", {
    user: user,
    category: category,
    budget: budget,
    duration: duration,
    spent: spent,
    plant: plant,
    notes: notes,
  });
}

export async function getUserData(user: string) {
  const response = await queryAPI("get-user-data", {
    user: user,
  });

  return response;
}

export async function deleteBudgetEntry(user: string, category: string) {
  const response = await queryAPI("delete", {
    user: user,
    category: category,
  });

  return response;
}

export async function updateSpentAmount(
  user: string,
  category: string,
  amountSpent: string
) {
  const response = await queryAPI("update-spent", {
    user: user,
    category: category,
    amount_spent: amountSpent,
  });

  return response;
}

export async function getSummary(user: string) {
  const response = await queryAPI("summary", {
    user: user,
  });

  return response;
}

export async function getAdvice(user: string, goal: string) {
  const response = await queryAPI("advice", {
    user: user,
    goal: goal,
  });

  return response;
}

// export async function clearUser(user: string = getLoginCookie() || "") {
//   return await queryAPI("clear-user", {
//     user,
//   });
// }

export async function clearUser(user: string = getLoginCookie() || "") {
  try {
    return await queryAPI("clear-user", {
      user,
    });
  } catch (error) {
    // If no user is found, return an empty object or null
    return {};
  }
}
