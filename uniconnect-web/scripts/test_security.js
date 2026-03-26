const bcrypt = require('bcryptjs');
const { z } = require('zod');

async function testSecurity() {
  console.log('--- Testing Security Enhancements ---');

  // Test 1: Password Hashing
  console.log('\n[1] Testing Hashing:');
  const password = 'mySecretPassword123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  const isCorrect = await bcrypt.compare(password, hash);
  const isWrong = await bcrypt.compare('wrongPassword', hash);
  
  console.log('Verification (correct):', isCorrect ? 'PASS' : 'FAIL');
  console.log('Verification (wrong):', !isWrong ? 'PASS' : 'FAIL');

  // Test 2: Zod Schema (Simulated)
  console.log('\n[2] Testing Zod Schema (Registration):');
  const matriculaSchema = z.string().regex(/^\d{7}$/);
  const validMatricula = matriculaSchema.safeParse('1234567');
  const invalidMatricula = matriculaSchema.safeParse('12345');
  
  console.log('Valid Matricula:', validMatricula.success ? 'PASS' : 'FAIL');
  console.log('Invalid Matricula (rejected):', !invalidMatricula.success ? 'PASS' : 'FAIL');

  // Test 3: String Sanitizer (Logic check)
  console.log('\n[3] Testing Sanitizer Logic:');
  const input = '<script>alert("xss")</script> Hello world! ';
  const sanitized = input.replace(/<[^>]*>?/gm, '').trim();
  console.log('Input:', input);
  console.log('Sanitized:', sanitized);
  console.log('Sanitation test:', sanitized === 'Hello world!' ? 'PASS' : 'FAIL');

  console.log('\n--- Verification Complete ---');
}

testSecurity().catch(console.error);
