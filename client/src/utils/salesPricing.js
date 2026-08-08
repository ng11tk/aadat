export const calculateLineTotal = (item = {}) => {
  const weight = Number(item.weight || 0);
  const qty = Number(item.qty || 0);
  const rate = Number(item.rate || 0);
  const rateType = item.rate_type;

  if (rateType === "quantity") {
    return qty * rate;
  }

  return weight * rate;
};

export const calculateOrderTotal = (items = []) => {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
};
