export function computeStats(records) {
  const total = records.length;
  const sum = records.reduce((acc, r) => acc + Number(r.amount), 0);

  const categoryTotals = {};
  records.forEach(r => {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + Number(r.amount);
  });
  let topCategory = "-";
  let topAmount = 0;
  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > topAmount) {
      topAmount = categoryTotals[cat];
      topCategory = cat;
    }
  }

  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTotal = records
      .filter(r => r.date === key)
      .reduce((acc, r) => acc + Number(r.amount), 0);
    days.push({ date: key, total: dayTotal });
  }

  return { total, sum, topCategory, days };
}
