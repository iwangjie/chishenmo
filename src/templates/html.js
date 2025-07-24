import { getClientScript } from './clientScript.js';

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>吃什么？摇一摇！</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .privilege-mode {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 15px;
            border-radius: 25px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .privilege-toggle {
            position: relative;
            width: 50px;
            height: 25px;
            background: #ccc;
            border-radius: 25px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .privilege-toggle.active {
            background: #4CAF50;
        }
        
        .privilege-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 21px;
            height: 21px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }
        
        .privilege-toggle.active .privilege-slider {
            transform: translateX(25px);
        }
        
        .privilege-input {
            display: none;
            margin-left: 10px;
        }
        
        .privilege-input input {
            padding: 5px 10px;
            border: 1px solid #ddd;
            border-radius: 15px;
            width: 80px;
            text-align: center;
        }
        
        .wheel-container {
            position: relative;
            width: 450px;
            height: 450px;
            margin: 30px auto;
        }
        
        .wheel {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
            border: 8px solid #333;
            transition: transform 0.1s ease-out;
            background: #f0f0f0;
        }
        
        .wheel-segment {
            position: absolute;
            width: 50%;
            height: 50%;
            transform-origin: 100% 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            font-size: 14px;
            text-align: center;
            padding: 10px;
            word-wrap: break-word;
            overflow: hidden;
        }
        
        .wheel-segment-text {
            transform: rotate(-45deg);
            max-width: 80px;
            line-height: 1.2;
        }
        
        .wheel-pointer {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 30px solid #ff4757;
            z-index: 10;
        }
        
        .controls {
            text-align: center;
            margin: 30px 0;
        }
        
        .input-group {
            margin: 20px 0;
        }
        
        input[type="text"] {
            padding: 12px 20px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 25px;
            width: 300px;
            margin-right: 10px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus {
            border-color: #667eea;
        }
        
        button {
            padding: 12px 25px;
            font-size: 16px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s;
            font-weight: bold;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .btn-secondary {
            background: #f1f2f6;
            color: #333;
        }
        
        .btn-secondary:hover {
            background: #ddd;
        }
        
        .btn-danger {
            background: #ff4757;
            color: white;
        }
        
        .btn-danger:hover {
            background: #ff3742;
        }
        
        .btn-success {
            background: #2ed573;
            color: white;
        }
        
        .btn-success:hover {
            background: #1dd1a1;
        }
        
        .result {
            text-align: center;
            margin: 20px 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .food-list {
            margin: 20px 0;
            text-align: center;
        }
        
        .food-item {
            display: inline-block;
            background: #f8f9fa;
            padding: 8px 15px;
            margin: 5px;
            border-radius: 20px;
            border: 1px solid #ddd;
        }
        
        .privilege-foods {
            margin: 20px 0;
            padding: 15px;
            background: #e8f5e8;
            border-radius: 10px;
            border: 2px solid #4CAF50;
        }
        
        .privilege-foods h4 {
            color: #2e7d32;
            margin-bottom: 10px;
        }
        
        .privilege-food-input {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .privilege-food-input input {
            width: 200px;
        }
        
        .history {
            margin-top: 30px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .history-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        
        .spinning {
            color: #ff4757;
            font-weight: bold;
        }
        
        @media (max-width: 600px) {
            .wheel-container {
                width: 350px;
                height: 350px;
            }
            
            input[type="text"] {
                width: 250px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .privilege-mode {
                position: relative;
                top: 0;
                right: 0;
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="privilege-mode">
        <span>特权模式</span>
        <div class="privilege-toggle" id="privilegeToggle" onclick="togglePrivilegeMode()">
            <div class="privilege-slider"></div>
        </div>
        <div class="privilege-input" id="privilegeInput">
            <input type="password" id="privilegePassword" placeholder="密码" maxlength="3">
        </div>
    </div>

    <div class="container">
        <h1>🍽️ 吃什么？摇一摇！</h1>
        
        <div class="controls">
            <div class="input-group">
                <button class="btn-secondary" onclick="initWheel()">初始化新转盘</button>
            </div>
            
            <div id="connectionStatus">
                <p>🔄 正在连接最新转盘...</p>
            </div>
        </div>
        
        <div id="gameArea" style="display: none;">
            <div class="wheel-container">
                <div class="wheel-pointer"></div>
                <div class="wheel" id="wheel"></div>
            </div>
            
            <div class="controls">
                <div class="input-group" id="foodInput" style="display: none;">
                    <input type="text" id="foodName" placeholder="输入你想吃的食物">
                    <button class="btn-primary" onclick="addFood()">添加食物</button>
                </div>
                
                <div id="userFood" style="display: none;">
                    <p>你的食物: <strong id="currentFood"></strong></p>
                    <button class="btn-secondary" onclick="editFood()">修改</button>
                </div>
                
                <div id="privilegeFoods" class="privilege-foods" style="display: none;">
                    <h4>🔑 特权模式 - 批量添加食物</h4>
                    <div class="privilege-food-input">
                        <input type="text" id="privilegeFoodName" placeholder="输入食物名称">
                        <button class="btn-success" onclick="addPrivilegeFood()">添加</button>
                        <button class="btn-danger" onclick="clearAllFoods()">清空所有</button>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        特权模式下可以添加多种食物，支持重复添加同一种食物
                    </p>
                </div>
                
                <button class="btn-primary" id="spinBtn" onclick="spinWheel()" disabled>开始转动</button>
            </div>
            
            <div class="result" id="result"></div>
            
            <div class="food-list">
                <h3>当前食物列表:</h3>
                <div id="foodList"></div>
            </div>
            
            <div class="history">
                <h3>历史结果:</h3>
                <div id="historyList"></div>
            </div>
        </div>
    </div>
    ${getClientScript()}`;