import { createBrowserRouter } from "react-router"
import { LoginPage } from "@/features/auth"
import { TodayPage } from "@/features/today"
import { RequireAuth } from "./layout/RequireAuth"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <TodayPage />
      </RequireAuth>
    ),
  },
])
