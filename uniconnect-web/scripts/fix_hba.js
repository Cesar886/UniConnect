const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
    HBA_FILE=$(echo '987654321' | sudo -S -u postgres psql -t -P format=unaligned -c "SHOW hba_file;")
    echo "HBA FILE: $HBA_FILE"
    
    echo '987654321' | sudo -S bash -c "echo 'host all all 0.0.0.0/0 md5' >> $HBA_FILE"
    echo '987654321' | sudo -S bash -c "echo 'host all all 0.0.0.0/0 scram-sha-256' >> $HBA_FILE"
    
    echo "--- tail pg_hba ---"
    echo '987654321' | sudo -S tail -n 5 $HBA_FILE
    
    echo "--- restart ---"
    echo '987654321' | sudo -S systemctl restart postgresql
    
    echo "--- Fetching Schema ---"
    echo '987654321' | sudo -S -u postgres psql -d tinder -c "\\d alumnos"
    
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '64.23.168.72',
  port: 22,
  username: 'um',
  password: '987654321'
});
