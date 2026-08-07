import pool from "../config/db.js";

export async function createSalesOrderPG({ buyerId, orderDate, items }) {
  const query = `
        SELECT sales.create_sales_order(
            $1::uuid,
            $2::date,
            $3::jsonb
        ) AS order_id;
    `;

  const { rows } = await pool.query(query, [
    buyerId,
    orderDate,
    JSON.stringify(items),
  ]);

  return rows[0].order_id;
}

export async function createBulkSalesOrders(orders) {
  const query = `
        SELECT *
        FROM sales.create_sales_orders($1::jsonb)
    `;

  const { rows } = await pool.query(query, [JSON.stringify(orders)]);

  return rows;
}
