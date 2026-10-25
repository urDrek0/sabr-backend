require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool, types } = require('pg');

types.setTypeParser(1082, function(stringValue){return stringValue})

const app = express();
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'https://sabar-report-pwa.hypafix2.workers.dev', 
        'https://sabar-report-pwa.pages.dev'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

const pool = new Pool ({
    connectionString : process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false}
})
app.get('/api/pasien', async (req, res) => {
    try{
        const result = await pool.query('select * from daftar_pasien order by id_pasien');
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});

app.get('/api/pegawai', async (req, res) => {
    try{
        const result = await pool.query('select * from daftar_pegawai order by id_pegawai');
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});

app.get('/api/sabr_report', async (req, res) => {
    try{
        const result = await pool.query('select * from sabr_report order by id_report');
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});

app.get('/api/shift_handler', async (req, res) => {
    try{
        const result = await pool.query('select * from shift_handler order by id_shift');
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});

app.listen(3000, () => {
    console.log('server jalan di http://localhost:3000');
})

app.post('/api/sabr_report', async (req, res) => {
    try{
        const {tanggal_shift, shift, pasien_id, situation, background, assessment, recommendation} = req.body
        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/; 

        if (strictRegex.test(situation) || strictRegex.test(background) || strictRegex.test(assessment) || strictRegex.test(recommendation)) {
            return res.status(400).json({ error: 'Terdapat karakter ilegal (<, >, ", dll). Hanya gunakan huruf, angka, titik, koma, dan spasi!' });
        }

        const queryText =`
        INSERT INTO sabr_report
        (tanggal_shift, shift, pasien_id, situation, background, assessment, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        `

        const values = [tanggal_shift, shift, pasien_id, situation, background, assessment, recommendation]
        const result = await pool.query(queryText, values)

        res.status(201).json(result.rows[0])
        console.log("Data Ditambahkan")
    }catch (err){
        console.log('error inserting sabr report : ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Laporan untuk pasien, shift, dan tanggal ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal menambah laporan.'})
    }
})


app.post('/api/pegawai', async(req,res) =>{
    try{
        const {nama, kode, aktif} = req.body
        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/;                 
        if(strictRegex.test(nama) || strictRegex.test(kode)){
            return res.status(400).json({ error: 'Terdapat karakter ilegal (<, >, ", dll). Hanya gunakan huruf, angka, titik, koma, dan spasi!' });
        }
        
        const queryText =`
        INSERT INTO daftar_pegawai
        (nama, kode, aktif)
        VALUES ($1, $2, $3)
        RETURNING *;
        `
        const values=[nama, kode, aktif]
        const result = await pool.query(queryText, values)
        res.status(201).json(result.rows[0])
        console.log("Data Ditambahkan")
    }catch(err){
        console.log('error inserting daftar pegawai: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data Pegawai ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal menambah pegawai.'})
    }
})

app.post('/api/pasien', async(req,res) =>{
    try{
        const {nama, umur, aktif} = req.body
        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/;                 
        if(strictRegex.test(nama) || strictRegex.test(umur)){
            return res.status(400).json({ error: 'Terdapat karakter ilegal (<, >, ", dll). Hanya gunakan huruf, angka, titik, koma, dan spasi!' });
        }
        const queryText =`
        INSERT INTO daftar_pasien
        (nama, umur, aktif)
        VALUES ($1, $2, $3)
        RETURNING *;
        `
        const values=[nama, umur, aktif]
        const result = await pool.query(queryText, values)
        res.status(201).json(result.rows[0])
        console.log("Data Ditambahkan")
    }catch(err){
        console.log('error inserting daftar pegawai: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data Pasien ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal menambah pasien.'})
    }
})

app.post('/api/shift_handler', async(req,res) => {
    try{
        const {tanggal_shift, shift, shift_leader, pegawai_id} = req.body
        
        const queryText = `
        INSERT INTO shift_handler
        (tanggal_shift, shift, shift_leader, pegawai_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `
        const values = [tanggal_shift, shift, shift_leader, pegawai_id]
        const result = await pool.query(queryText, values)
        res.status(201).json(result.rows[0])
        console.log("Data Shift Ditambahkan")
    }catch(err){
        console.log('error inserting data shift: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data shift ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal menambah Data Shift.'})
    }
})

app.delete('/api/sabr_report/:id_report', async (req,res) => {
    const reportId = req.params.id_report
    try{
        const result = await pool.query ('DELETE FROM sabr_report WHERE id_report = $1 RETURNING id_report', [reportId])
        if (result.rowCount === 0){
            return res.status(400).json({error : 'Laporan Tidak Ditemukan'})
        }
        console.log('Data Report Dihapus')
        res.status(200).json({ message: 'Laporan berhasil dihapus' });
    }catch(err){
        console.error("Error Deleting Report : ", err)
        res.status(500).json({error: 'Gagal Menghapus Laporan'})
    }
})
app.delete('/api/shift_handler/:id_shift', async (req,res) => {
    const ShiftId = req.params.id_shift
    try{
        const result = await pool.query ('DELETE FROM shift_handler WHERE id_shift = $1 RETURNING id_shift', [ShiftId])
        if (result.rowCount === 0){
            return res.status(400).json({error : 'Shift Tidak Ditemukan'})
        }
        console.log('Data Report Dihapus')
        res.status(200).json({ message: 'Shift berhasil dihapus' });
    }catch(err){
        console.error("Error Deleting Report : ", err)
        res.status(500).json({error: 'Gagal Menghapus Shift'})
    }
})

app.delete('/api/pegawai/:id_pegawai', async (req,res) => {
    const pegawaiId = req.params.id_pegawai
    try{
        const result = await pool.query ('UPDATE daftar_pegawai SET aktif = false WHERE id_pegawai = $1 RETURNING id_pegawai', [pegawaiId])
        if (result.rowCount === 0){
            return res.status(400).json({error : 'Pegawai Tidak Ditemukan'})
        }
        console.log('Pegawai berhasil dihapus')
        res.status(200).json({ message: 'Pegawai berhasil dihapus' });
    }catch(err){
        console.error("Error Deleting Report : ", err)
        res.status(500).json({error: 'Gagal Menghapus Laporan'})
    }
})

app.delete('/api/pasien/:id_pasien', async (req,res) => {
    const pasienId = req.params.id_pasien
    try{
        const result = await pool.query ('UPDATE daftar_pasien SET aktif = false WHERE id_pasien = $1 RETURNING id_pasien', [pasienId])
        if (result.rowCount === 0){
            return res.status(400).json({error : 'Pasien Tidak Ditemukan'})
        }
        console.log('Pasien berhasil dihapus')
        res.status(200).json({ message: 'Pasien berhasil dihapus' });
    }catch(err){
        console.error("Error Deleting Report : ", err)
        res.status(500).json({error: 'Gagal Menghapus Laporan'})
    }
})

app.put('/api/pegawai/:id_pegawai', async (req,res) => {
    try{
        const id = req.params.id_pegawai
        const {nama, kode, aktif} = req.body

        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/;                 
        if(strictRegex.test(nama) || strictRegex.test(kode)){
            return res.status(400).json({ error: 'Terdapat karakter ilegal (<, >, ", dll). Hanya gunakan huruf, angka, titik, koma, dan spasi!' });
        }

        const queryText =`
        UPDATE daftar_pegawai
        SET nama = $1, kode = $2, aktif = $3
        WHERE id_pegawai = $4
        RETURNING *;
        `
        const values=[nama, kode, aktif, id]
        const result = await pool.query(queryText, values)
        if (result.rowCount === 0) {return res.status(400).json({error: "Pegawai Tidak Ditemukan"})}
        res.status(200).json(result.rows[0])
        console.log('Pegawai Diperbaharui')
    }catch(err){
        console.log('error updating daftar pegawai: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data Pegawai ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal memperbaharui pegawai.'})
    }
})

app.put('/api/pasien/:id_pasien', async (req,res) => {
    try{
        const id = req.params.id_pasien
        const {nama, umur, aktif} = req.body

        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/;                 
        if(strictRegex.test(nama) || strictRegex.test(umur)){
            return res.status(400).json({ error: 'Terdapat karakter ilegal (<, >, ", dll). Hanya gunakan huruf, angka, titik, koma, dan spasi!' });
        }

        const queryText =`
        UPDATE daftar_pasien
        SET nama = $1, umur = $2, aktif = $3
        WHERE id_pasien = $4
        RETURNING *;
        `
        const values=[nama, umur, aktif, id]
        const result = await pool.query(queryText, values)
        if (result.rowCount === 0) {return res.status(400).json({error: "Pasien Tidak Ditemukan"})}
        res.status(200).json(result.rows[0])
        console.log('Pasien Diperbaharui')
    }catch(err){
        console.log('error updating daftar pasien: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data Pasien ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal memperbaharui pasien.'})
    }
})

app.put('/api/sabr_report/:id_report', async (req, res) => {
    try{

        const id = req.params.id_report
        const {tanggal_shift, shift, pasien_id, situation, background, assessment, recommendation} = req.body
        
        const strictRegex = /[^a-zA-Z0-9\s.,\n\r/]/; 
        if (strictRegex.test(situation) || strictRegex.test(background) || strictRegex.test(assessment) || strictRegex.test(recommendation)) {
            return res.status(400).json({ error: 'Terdapat karakter ilegal. Hanya gunakan huruf, angka, titik, koma, garis miring, dan spasi!' });
        
        }
        const queryText =`
        UPDATE sabr_report
        SET tanggal_shift = $1, shift = $2, pasien_id = $3, situation = $4, background = $5, assessment = $6, recommendation = $7
        WHERE id_report = $8
        RETURNING *;
        `

        const values = [tanggal_shift, shift, pasien_id, situation, background, assessment, recommendation, id]
        const result = await pool.query(queryText, values)

        if (result.rowCount === 0) {return res.status(400).json({error: "Laporan Tidak Ditemukan"})}
        res.status(200).json(result.rows[0])
        console.log('Laporan Diperbaharui')
    }catch (err){
        console.log('error inserting sabr report : ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Laporan untuk pasien, shift, dan tanggal ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal memperbaharui laporan.'})
    }
})

app.put('/api/shift_handler/:id_shift', async(req,res) => {
    try{
        const id = req.params.id_shift
        const {tanggal_shift, shift, shift_leader, pegawai_id} = req.body

        const queryText = `
        UPDATE shift_handler
        SET tanggal_shift = $1, shift = $2, shift_leader = $3, pegawai_id = $4
        WHERE id_shift = $5
        RETURNING *;
        `
        const values = [tanggal_shift, shift, shift_leader, pegawai_id, id]
        const result = await pool.query(queryText, values)
        res.status(201).json(result.rows[0])
        console.log("Data Shift Diperbaharui")
    }catch(err){
        console.log('error inserting data shift: ', err)
        if (err.code === '23505'){
            return res.status(409).json({error: 'Data shift ini sudah ada'})
        }
        res.status(500).json({error: 'Gagal memperbaharui Data Shift.'})
    }
})
module.exports = app;