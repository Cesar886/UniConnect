const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
    echo "--- 1. Modificando tabla alumnos ---"
    echo '987654321' | sudo -S -u postgres psql -d tinder -c "ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS email VARCHAR(150) UNIQUE, ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"
    
    echo "--- 2. Estableciendo password de postgres a 987654321 ---"
    echo '987654321' | sudo -S -u postgres psql -c "ALTER USER postgres PASSWORD '987654321';"
    
    echo "--- 3. Obteniendo rutas de config ---"
    CONF_FILE=$(echo '987654321' | sudo -S -u postgres psql -t -P format=unaligned -c "SHOW config_file;")
    HBA_FILE=$(echo '987654321' | sudo -S -u postgres psql -t -P format=unaligned -c "SHOW hba_file;")
    
    echo "Files: $CONF_FILE | $HBA_FILE"
    
    echo "--- 4. Abriendo red ---"
    echo '987654321' | sudo -S sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" $CONF_FILE
    echo '987654321' | sudo -S sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" $CONF_FILE
    
    echo '987654321' | sudo -S bash -c "grep -q '0.0.0.0/0' $HBA_FILE || echo 'host all all 0.0.0.0/0 md5' >> $HBA_FILE"
    
    echo "--- 5. Reiniciando postgresql ---"
    echo '987654321' | sudo -S systemctl restart postgresql
    
    echo "--- HECHO ---"
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error("Connection Error:", err);
}).connect({
  host: '64.23.168.72',
  port: 22,
  username: 'um',
  password: '987654321'
});
