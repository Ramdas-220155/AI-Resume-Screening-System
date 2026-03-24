# ⚡ ResumeIQ — Team Setup Guide
# Every teammate follows THIS EXACT guide. Same result on every laptop.
# Works on: Windows (XAMPP) · macOS (MAMP/Homebrew) · Linux (Apache)

---

## 🗺️ What You Need (Pick ONE stack per OS)

| OS | Recommended Stack | Download |
|----|-------------------|----------|
| **Windows** | XAMPP + MongoDB | See Section A |
| **macOS** | Homebrew + MAMP | See Section B |
| **Linux (Ubuntu)** | Apache + PHP + MongoDB | See Section C |

---

## ═══════════════════════════════════════
## SECTION A — WINDOWS (XAMPP)
## ═══════════════════════════════════════

### A1. Install XAMPP
1. Download: https://www.apachefriends.org/download.html
   → Choose **PHP 8.1+** version
2. Install to `C:\xampp\` (default)
3. Open **XAMPP Control Panel** → Start **Apache**

### A2. Install MongoDB Community Server
1. Download: https://www.mongodb.com/try/download/community
   → Version: 7.0 · Platform: Windows · Package: MSI
2. Run installer → "Complete" install
3. ✅ Check **"Install MongoDB as a Service"** (auto-starts on boot)
4. After install: MongoDB runs automatically. To verify:
   - Open **Services** (Win+R → `services.msc`)
   - Find "MongoDB" → Status should be "Running"

### A3. Install PHP MongoDB Extension
1. Open XAMPP Control Panel → Click **Shell** button
2. Run these commands:
```
cd C:\xampp\php
php -version
```
3. Note your PHP version (e.g., 8.1.x, 8.2.x)
4. Download the correct .dll from: https://pecl.php.net/package/mongodb
   → Click the version matching your PHP (e.g., 1.18.1)
   → Download `php_mongodb-1.18.1-8.1-ts-vs16-x64.zip` (match your PHP version)
5. Extract → copy `php_mongodb.dll` to `C:\xampp\php\ext\`
6. Open `C:\xampp\php\php.ini` in Notepad
7. Find the `[PHP]` section and add this line:
   ```
   extension=mongodb
   ```
8. **Restart Apache** in XAMPP Control Panel

### A4. Install Composer
1. Download: https://getcomposer.org/Composer-Setup.exe
2. Run installer → it auto-detects XAMPP PHP
3. Verify: Open new CMD → `composer --version`

### A5. Place the Project
```
Copy the entire ResumeIQ2 folder to:
C:\xampp\htdocs\ResumeIQ2\
```

### A6. Install MongoDB PHP Library
Open CMD (as Administrator):
```
cd C:\xampp\htdocs\ResumeIQ2\backend
composer require mongodb/mongodb
```

### A7. Initialize
Open these URLs in browser:
```
http://localhost/ResumeIQ2/backend/api/setup.php
http://localhost/ResumeIQ2/backend/api/jobs.php?action=seed
```
Both should show `{"success":true,...}`

### A8. Open App
```
http://localhost/ResumeIQ2/frontend/index.html
```
**DONE!** ✅

---

## ═══════════════════════════════════════
## SECTION B — macOS
## ═══════════════════════════════════════

### B1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### B2. Install PHP 8.1+
```bash
brew install php
php -version   # should show 8.1 or higher
```

### B3. Install MongoDB
```bash
# Add MongoDB tap
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB (auto on login)
brew services start mongodb/brew/mongodb-community@7.0

# Verify it's running
mongosh --eval "db.runCommand({ping:1})"
# Should show: { ok: 1 }
```

### B4. Install PHP MongoDB Extension
```bash
# Install PECL if needed
pecl install mongodb

# Find your php.ini location
php --ini | grep "Loaded Configuration"

# Add extension to php.ini
echo "extension=mongodb.so" | sudo tee -a $(php --ini | grep "Loaded Configuration" | awk '{print $NF}')

# Restart PHP-FPM
brew services restart php
```

### B5. Install Composer
```bash
brew install composer
composer --version
```

### B6. Install MAMP (for Apache web server)
1. Download: https://www.mamp.info/en/downloads/
2. Open MAMP → Preferences → PHP → PHP 8.1+
3. Set Web Root: `/Applications/MAMP/htdocs`
4. Start servers

### B7. Place the Project
```bash
cp -r ResumeIQ2 /Applications/MAMP/htdocs/ResumeIQ2
```

### B8. Install MongoDB PHP Library
```bash
cd /Applications/MAMP/htdocs/ResumeIQ2/backend
composer require mongodb/mongodb
```

### B9. Initialize
```
http://localhost:8888/ResumeIQ2/backend/api/setup.php
http://localhost:8888/ResumeIQ2/backend/api/jobs.php?action=seed
```
(MAMP default port is 8888. If you changed it, use your port.)

### B10. Open App
```
http://localhost:8888/ResumeIQ2/frontend/index.html
```
**DONE!** ✅

---

## ═══════════════════════════════════════
## SECTION C — LINUX (Ubuntu/Debian)
## ═══════════════════════════════════════

### C1. Update & Install Apache + PHP
```bash
sudo apt update && sudo apt upgrade -y

# Install Apache
sudo apt install apache2 -y

# Install PHP 8.1 (if not available, see note below)
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.1 php8.1-cli php8.1-common php8.1-curl php8.1-mbstring php8.1-xml -y

# Verify
php -version  # must be 8.1+
```

### C2. Install MongoDB
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repo
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt update
sudo apt install mongodb-org -y

# Start and enable on boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.runCommand({ping:1})"  # should show { ok: 1 }
```

### C3. Install PHP MongoDB Extension
```bash
sudo apt install php-pear php8.1-dev -y
sudo pecl install mongodb

# Add to PHP config
echo "extension=mongodb.so" | sudo tee /etc/php/8.1/apache2/conf.d/20-mongodb.ini
echo "extension=mongodb.so" | sudo tee /etc/php/8.1/cli/conf.d/20-mongodb.ini

# Restart Apache
sudo systemctl restart apache2
```

### C4. Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### C5. Place the Project
```bash
sudo cp -r ResumeIQ2 /var/www/html/ResumeIQ2

# Give write permissions for uploads
sudo chmod -R 755 /var/www/html/ResumeIQ2
sudo chown -R www-data:www-data /var/www/html/ResumeIQ2
```

### C6. Install MongoDB PHP Library
```bash
cd /var/www/html/ResumeIQ2/backend
sudo composer require mongodb/mongodb
```

### C7. Initialize
```
http://localhost/ResumeIQ2/backend/api/setup.php
http://localhost/ResumeIQ2/backend/api/jobs.php?action=seed
```

### C8. Open App
```
http://localhost/ResumeIQ2/frontend/index.html
```
**DONE!** ✅

---

## 🔧 COMMON ERRORS & FIXES

### ❌ Error: "Class 'MongoDB\Client' not found"
**Cause:** MongoDB PHP extension not loaded OR composer packages not installed
**Fix:**
```bash
# Check extension is loaded:
php -m | grep mongodb

# If not listed, add to php.ini:
extension=mongodb     # Windows (.dll)
extension=mongodb.so  # Mac/Linux

# Restart Apache, then run:
cd backend && composer require mongodb/mongodb
```

---

### ❌ Error: "Connection refused" / "Could not connect to MongoDB"
**Cause:** MongoDB service not running
**Fix:**
```bash
# Windows: Open Services → start "MongoDB"
# macOS:
brew services start mongodb/brew/mongodb-community@7.0
# Linux:
sudo systemctl start mongod
sudo systemctl status mongod   # check it's "active (running)"
```

---

### ❌ Error: "Class not found" / "vendor/autoload.php not found"
**Cause:** `composer require` not run inside backend folder
**Fix:**
```bash
cd ResumeIQ2/backend
composer require mongodb/mongodb
# You should see: vendor/ folder created
```

---

### ❌ Error: "Access forbidden" / 403 on XAMPP
**Cause:** Apache can't read the folder
**Fix (Windows):**
- Right-click `ResumeIQ2` folder → Properties → Security → give full access to current user
- Or move to `C:\xampp\htdocs\` exactly

**Fix (Linux):**
```bash
sudo chown -R www-data:www-data /var/www/html/ResumeIQ2
sudo chmod -R 755 /var/www/html/ResumeIQ2
```

---

### ❌ Error: "Upload failed" when uploading resume
**Cause:** `backend/uploads/resumes/` folder doesn't exist or isn't writable
**Fix:**
```bash
# Run setup first:
http://localhost/ResumeIQ2/backend/api/setup.php

# Or manually create:
mkdir -p backend/uploads/resumes
chmod 777 backend/uploads/resumes        # Linux/Mac
# Windows: right-click → Properties → Security → Full Control
```

---

### ❌ Error: "Undefined index: HTTP_X_USER_ID"
**Cause:** Custom headers blocked by Apache
**Fix:** Create `.htaccess` in the backend root (already included in project)

---

### ❌ CORS errors in browser console
**Cause:** PHP not sending CORS headers
**Fix:** Make sure Apache has `mod_headers` enabled:
```bash
sudo a2enmod headers
sudo systemctl restart apache2
```

---

### ❌ White page / PHP errors showing
**Cause:** PHP version mismatch (need 8.1+)
**Check:**
```bash
php -version   # must be 8.1 or higher
```

---

## ✅ VERIFICATION CHECKLIST

Run through this after setup to confirm everything works:

| Check | URL / Command | Expected |
|-------|---------------|----------|
| Apache running | `http://localhost` | Apache welcome page |
| MongoDB running | `mongosh --eval "db.ping()"` | `{ ok: 1 }` |
| MongoDB ext loaded | `php -m \| grep mongodb` | `mongodb` |
| Composer installed | `backend/vendor/` folder exists | folder present |
| Setup API | `http://localhost/.../setup.php` | `{"success":true}` |
| Jobs seeded | `http://localhost/.../jobs.php?action=seed` | `{"success":true}` |
| App loads | `http://localhost/.../frontend/index.html` | Landing page shows |
| Register | Create account on login page | Redirects to dashboard |
| Jobs list | Browse Jobs page | 16 job cards shown |

---

## 📁 Final Project Path Summary

| OS | Place project here |
|----|-------------------|
| Windows XAMPP | `C:\xampp\htdocs\ResumeIQ2\` |
| macOS MAMP | `/Applications/MAMP/htdocs/ResumeIQ2/` |
| Linux Apache | `/var/www/html/ResumeIQ2/` |

**After placing:** always run `composer require mongodb/mongodb` inside `backend/`

---

## 🆘 Still getting errors?

1. **Open this URL** and copy-paste the output to your team:
   ```
   http://localhost/ResumeIQ2/backend/api/setup.php
   ```
2. **Check PHP info:**
   Create a file `info.php` in web root with `<?php phpinfo(); ?>` — check if `mongodb` appears in extensions

3. **Check MongoDB:**
   ```bash
   mongosh
   use resumeiq
   show collections
   ```

---

*ResumeIQ v3.0 · Team Setup Guide · Works on Windows · macOS · Linux*
