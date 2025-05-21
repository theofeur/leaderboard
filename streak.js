function getStreakValue(matches) {
    if (!matches || matches.length === 0) return 0;

    let streakType = matches[0].win ? "win" : "loss";
    let streakCount = 1;

    for (let i = 1; i < matches.length; i++) {
      if ((streakType === "win" && matches[i].win) || (streakType === "loss" && !matches[i].win)) {
        streakCount++;
      } else {
        break; // streak interrompue
      }
    }

    // On ne considère une streak que si elle fait 3 matchs ou plus
    if (streakCount >= 3) {
      return streakType === "win" ? streakCount : -streakCount;
    } else {
      return 0;
    }
  }

  export { getStreakValue };