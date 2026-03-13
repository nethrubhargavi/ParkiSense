import React from "react";

/* ─── Navigation Pages Config ─── */
const NAV_ITEMS = [
  {
    id: "family-history",
    label: "Family History",
    icon: "👨‍👩‍👧",
  },
  {
    id: "symptoms",
    label: "Symptoms",
    icon: "📋",
  },
  {
    id: "hand-tremor",
    label: "Hand Tremor",
    icon: "🔵",
  },
  {
    id: "voice-test",
    label: "Voice Test",
    icon: "🟢",
  },
  {
    id: "face-assessment",
    label: "Facial Masking",
    icon: "🟡",
  },
  {
    id: "medical-reports",
    label: "Medical Reports",
    icon: "📄",
  },
];

function Navigation({ currentPage, onPageChange }) {
  return (
    <nav className="navbar">
      <div className="nav-container">

        {/* ─── Brand ─── */}
        <div className="nav-brand">
          <h2>🏥 Parkinson's Assessment</h2>
        </div>

        {/* ─── Navigation Menu ─── */}
        <ul className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => onPageChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

      </div>
    </nav>
  );
}

export default Navigation;
