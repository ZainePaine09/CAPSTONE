This PHP backend uses a simple SQLite database located at `data.sqlite`.

Endpoints:
- POST /server/php/register.php  { email, password, firstName, lastName, studentNumber, program }
- POST /server/php/login.php     { email, password }
- POST /server/php/admin_login.php { email, password }

The scripts auto-create required tables on first request. Tokens are simple random tokens stored in `tokens` table. For production use, secure transport (HTTPS) and stronger JWT-based tokens are recommended.
