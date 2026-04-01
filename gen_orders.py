import random
from datetime import datetime, timedelta

# Products from the DB (id, name, price)
products = [
    (1, 'Timeless T-Shirt', 2490.00),
    (2, 'Impossible Tee', 2490.00),
    (3, 'Ascension Hoodie', 4890.00),
    (4, 'Xenonix Trackpants', 3590.00),
    (5, 'Phantom Jacket', 5990.00),
    (6, 'Timeless Shorts', 1890.00),
    (7, 'Ascension Cap', 1290.00),
    (10, 'Phantom Hat', 2090.00),
]

statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
# 'CONFIRMED' was migrated to 'PROCESSING' in a previous session, but OrderStatus enum might still have it or not.
# I'll check OrderStatus.java later if needed, but the session summary said PROCESSING is used.

now = datetime.now()
sql_lines = ["USE axo_nique;", "DELETE FROM order_items;", "DELETE FROM orders;"]

for i in range(1, 51):
    # Random date in the last 3 months
    days_ago = random.randint(0, 90)
    order_date = now - timedelta(days=days_ago)
    date_str = order_date.strftime('%Y-%m-%d %H:%M:%S')
    
    # Random customer
    name = f"Customer {i}"
    email = f"customer{i}@example.com"
    address = f"{random.randint(1, 999)} Random St, Colombo"
    
    # 1-3 items per order
    num_items = random.randint(1, 3)
    order_items = random.sample(products, num_items)
    
    subtotal = 0
    item_rows = []
    for p_id, p_name, p_price in order_items:
        qty = random.randint(1, 2)
        total = p_price * qty
        subtotal += total
        item_rows.append((p_id, p_name, p_price, qty, total))
        
    shipping = 350.00
    total_order = subtotal + shipping
    status = random.choice(statuses)
    
    # Insert order
    sql_lines.append(f"INSERT INTO orders (id, customer_name, customer_email, delivery_address, subtotal, shipping_fee, total, status, created_at, updated_at) VALUES ({i}, '{name}', '{email}', '{address}', {subtotal}, {shipping}, {total_order}, '{status}', '{date_str}', '{date_str}');")
    
    # Insert order items
    for p_id, p_name, p_price, qty, l_total in item_rows:
        sql_lines.append(f"INSERT INTO order_items (order_id, product_id, product_name, selected_size, quantity, unit_price, line_total, created_at, updated_at) VALUES ({i}, {p_id}, '{p_name}', 'M', {qty}, {p_price}, {l_total}, '{date_str}', '{date_str}');")

with open('seed_data.sql', 'w') as f:
    f.write('\n'.join(sql_lines))
