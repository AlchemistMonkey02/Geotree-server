@echo off
setlocal

:: Define project root
set PROJECT_ROOT=%CD%\project-root

:: Create directories
mkdir "%PROJECT_ROOT%\models"
mkdir "%PROJECT_ROOT%\controllers"
mkdir "%PROJECT_ROOT%\routes"
mkdir "%PROJECT_ROOT%\middlewares"
mkdir "%PROJECT_ROOT%\utils"

:: Create files
echo. > "%PROJECT_ROOT%\models\userModel.js"
echo. > "%PROJECT_ROOT%\models\tableModel.js"
echo. > "%PROJECT_ROOT%\models\trackingModel.js"

echo. > "%PROJECT_ROOT%\controllers\userController.js"
echo. > "%PROJECT_ROOT%\controllers\tableController.js"

echo. > "%PROJECT_ROOT%\routes\userRoutes.js"
echo. > "%PROJECT_ROOT%\routes\tableRoutes.js"

echo. > "%PROJECT_ROOT%\middlewares\authMiddleware.js"

echo. > "%PROJECT_ROOT%\utils\helpers.js"

echo. > "%PROJECT_ROOT%\server.js"
echo. > "%PROJECT_ROOT%\config.js"
echo. > "%PROJECT_ROOT%\.env"

echo Project structure created successfully!

endlocal
exit /b
