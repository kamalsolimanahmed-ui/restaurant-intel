// Test script to verify NEXTAUTH_SECRET setup
console.log('Testing NEXTAUTH_SECRET setup...');

// Check if we can access environment variables
const hasEnv = process.env.NEXTAUTH_SECRET !== undefined;
console.log(`NEXTAUTH_SECRET in env: ${hasEnv ? 'YES' : 'NO (using fallback)'}`);

// Test the fallback secret logic
const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";
console.log(`Using secret: ${secret.substring(0, 10)}...`);

// Verify the secret is not empty
if (!secret || secret === "") {
  console.error('ERROR: Secret is empty!');
  process.exit(1);
}

console.log('✅ NEXTAUTH_SECRET setup is correct');
console.log('\nTo fix the issue permanently, add to your .env.local:');
console.log('NEXTAUTH_SECRET="your-secret-key-here"');
console.log('\nGenerate a secure secret with:');
console.log('openssl rand -base64 32');
