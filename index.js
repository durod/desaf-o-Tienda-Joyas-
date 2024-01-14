import express from 'express';
import cors from 'cors';
import consultaRouter from './consulta.js';

const app = express();
const port = 3000;

// Middleware para mostrar detalles de la consulta
const displayConsulta = (req, res, next) => {
    const parametros = req.query; // Cambiar de req.params a req.query
    const querys = req.query;
    const url = req.url;
    const metodo = req.method;
  
    console.log(`
      El día de hoy ${new Date()}
      Se ha recibido una consulta en la ruta ${url} 
      con los siguientes detalles:
      Método: ${metodo}
      Parámetros: ${JSON.stringify(parametros)} 
      Query Strings: ${JSON.stringify(querys)}
    `);
  
    next();
  };

app.use(express.json());
app.use(cors());

// Middleware para el registro de eventos
app.use(displayConsulta);

// Rutas
app.use('/joyas', consultaRouter);

// Middleware para capturar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});