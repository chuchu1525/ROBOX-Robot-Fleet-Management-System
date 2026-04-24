export type RobotRecord = Record<string, unknown> & {
  id: string | number;
};

export type RobotListResponse = {
  data: RobotRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "robox-secret-key";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export async function getRobots(params?: {
  status?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set("status", params.status);
  if (params?.location) searchParams.set("location", params.location);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  return apiRequest<RobotListResponse>(
    `/robots${queryString ? `?${queryString}` : ""}`,
  );
}

export async function getRobotById(id: string | number) {
  return apiRequest<RobotRecord>(`/robots/${encodeURIComponent(String(id))}`);
}

export async function createRobot(payload: Record<string, unknown>) {
  return apiRequest<RobotRecord>("/robots", { method: "POST", body: payload });
}

export async function updateRobot(
  id: string | number,
  payload: Record<string, unknown>,
) {
  return apiRequest<RobotRecord>(`/robots/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteRobot(id: string | number) {
  return apiRequest<{ message: string; data: RobotRecord }>(
    `/robots/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    },
  );
}

export function getAllKeys(robots: RobotRecord[]) {
  const keys = new Set<string>();
  robots.forEach((robot) => {
    Object.keys(robot).forEach((key) => keys.add(key));
  });

  const preferredOrder = [
    "id",
    "name",
    "status",
    "battery",
    "location",
    "model",
    "lastMaintenance",
  ];

  const ordered = Array.from(keys).sort((a, b) => {
    const ai = preferredOrder.indexOf(a);
    const bi = preferredOrder.indexOf(b);

    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  return ordered;
}
