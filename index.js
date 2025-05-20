const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Log global para todas as requisições recebidas
app.use((req, res, next) => {
  console.log(`➡️ [${req.method}] ${req.url} | Body:`, req.body);
  next();
});

const pool = new Pool({
  user: 'appuser',
  host: 'dbaas-db-9525861-do-user-14245463-0.d.db.ondigitalocean.com',
  database: 'appdb',
  password: 'SenhaForte123',
  port: 25060,
  ssl: { rejectUnauthorized: false },
});

// 📍 Rota de Localização com Logs
app.post('/localizacao', async (req, res) => {
  const { id_motorista, latitude, longitude, velocidade, bateria } = req.body;

  console.log('📍 [LOCALIZAÇÃO RECEBIDA]');
  console.log(`- id_motorista: ${id_motorista}`);
  console.log(`- Latitude: ${latitude}`);
  console.log(`- Longitude: ${longitude}`);
  console.log(`- Velocidade: ${velocidade}`);
  console.log(`- Bateria: ${bateria}`);

  if (!id_motorista || !latitude || !longitude) {
    console.warn('[WARN] Dados obrigatórios faltando.');
    return res.status(400).json({ success: false, error: 'Dados obrigatórios faltando.' });
  }

  try {
    await pool.query(
      `INSERT INTO public.localizacoes (id_motorista, latitude, longitude, velocidade, bateria) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id_motorista, latitude, longitude, velocidade || 0, bateria || 0]
    );

    console.log('✅ [SUCESSO] Localização salva no banco.');
    res.json({ success: true });
  } catch (err) {
    console.error('[ERROR] Erro ao inserir localização no banco:', err);
    res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
});

// 🔐 Rota de Login com Logs
app.post('/login', async (req, res) => {
  const { cpf } = req.body;

  console.log('🔐 [LOGIN RECEBIDO]');
  console.log(`- CPF: ${cpf}`);

  if (!cpf) {
    console.warn('[WARN] CPF não informado!');
    return res.status(400).json({ success: false, error: 'CPF não informado.' });
  }

  try {
    const motoristaQuery = await pool.query(
      'SELECT id_motorista, nome, cpf, telefone FROM motoristas WHERE cpf = $1',
      [cpf]
    );

    if (motoristaQuery.rows.length === 0) {
      console.warn('[WARN] Motorista não encontrado.');
      return res.json({ success: false, error: 'Motorista não encontrado.' });
    }

    const motorista = motoristaQuery.rows[0];

    const veiculoQuery = await pool.query(
      'SELECT placa, modelo, cor, ano FROM veiculos WHERE id_motorista = $1',
      [motorista.id_motorista]
    );

    const veiculo = veiculoQuery.rows.length > 0 ? veiculoQuery.rows[0] : null;

    console.log('✅ [SUCESSO] Login autorizado.');
    res.json({
      success: true,
      motorista: {
        id_motorista: motorista.id_motorista,
        nome: motorista.nome,
        cpf: motorista.cpf,
        telefone: motorista.telefone,
      },
      veiculo: veiculo,
    });

  } catch (err) {
    console.error('[ERROR] Erro na consulta SQL:', err);
    res.status(500).json({ success: false, error: 'Erro interno no servidor.' });
  }
});

app.listen(3000, '0.0.0.0', () => console.log('[INFO] ✅ API Rodando na porta 3000'));
