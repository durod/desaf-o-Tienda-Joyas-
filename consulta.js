import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joyas',
  password: '1234',
  port: 5432,
});

// Ruta GET /joyas
router.get('/', async (req, res) => {
  try {
    const { limits, page, order_by } = req.query;

    // Validar que limits, page y order_by estén presentes
    if (!limits || !page || !order_by) {
      // Devolver todas las joyas si no se proporcionan parámetros
      const result = await pool.query('SELECT * FROM inventario');
      const joyas = result.rows.map(joya => {
        return {
          ...joya,
          links: [
            { rel: 'self', href: `/joyas/${joya.id}` },
            { rel: 'categoria', href: `/joyas/filtros?categoria=${joya.categoria}` },
          ],
        };
      });

      return res.status(200).json({ joyas });
    }

    // Si limits y page son presentes, validar que sean números
    if ((limits && isNaN(limits)) || (page && isNaN(page))) {
      return res.status(400).json({ error: 'Parámetros incorrectos' });
    }

    // Realizar la consulta a la base de datos usando consultas parametrizadas
    const result = await pool.query({
      text: 'SELECT * FROM inventario ORDER BY $1 LIMIT $2 OFFSET $3',
      values: [order_by, limits, (page - 1) * limits],
    });

    // Estructura HATEOAS
    const joyas = result.rows.map(joya => {
      return {
        ...joya,
        links: [
          { rel: 'self', href: `/joyas/${joya.id}` },
          { rel: 'categoria', href: `/joyas/filtros?categoria=${joya.categoria}` },
        ],
      };
    });

    res.json({ joyas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener joyas' });
  }
});

// Ruta GET /joyas/filtros
router.get('/filtros', async (req, res) => {
  try {
    let { precio_min, precio_max, categoria, metal } = req.query;

    // Validar que precio_min, precio_max sean números si están presentes
    if ((precio_min && isNaN(precio_min)) || (precio_max && isNaN(precio_max))) {
      return res.status(400).json({ error: 'Parámetros incorrectos' });
    }

    // Construir la consulta SQL dinámicamente
    const queryValues = [];
    let queryText = 'SELECT * FROM inventario WHERE true';

    if (precio_min !== undefined) {
      queryText += ' AND precio >= $1';
      queryValues.push(precio_min);
    }

    if (precio_max !== undefined) {
      queryText += ' AND precio <= $2';
      queryValues.push(precio_max);
    }

    if (categoria) {
      queryText += ' AND categoria = $3';
      queryValues.push(categoria);
    }

    if (metal) {
      queryText += ' AND metal = $4';
      queryValues.push(metal);
    }

    // Realizar la consulta a la base de datos usando consultas parametrizadas
    const result = await pool.query({
      text: queryText,
      values: queryValues,
    });

    res.json({ joyas: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al filtrar joyas' });
  }
});

export default router;
