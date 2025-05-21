function getKdaClass(kda) {
    if (kda <= 0.3) return "kda-blood-red";
    if (kda < 1) return "kda-dark-red";
    if (kda > 4) return "kda-gold";
    if (kda > 2.5) return "kda-cyan";
    else return "kda-normal";
  }

  export { getKdaClass };