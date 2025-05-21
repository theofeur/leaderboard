function getRoleIcon(role) {
    const roleIcons = {
      TOP: "assets/roles/TOP.png",
      JUNGLE: "assets/roles/JUNGLE.png",
      MIDDLE: "assets/roles/MIDDLE.png",
      BOTTOM: "assets/roles/BOTTOM.png",
      UTILITY: "assets/roles/UTILITY.png"
    };

    return roleIcons[role] || "assets/roles/unknown.png"; // fallback en cas de rôle inattendu
  }

  export { getRoleIcon};