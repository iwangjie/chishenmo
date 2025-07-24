export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/') {
        return new Response(getHTML(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
        });
      }

      if (url.pathname === '/api/init' && request.method === 'POST') {
        const wheelId = generateId();
        const wheelData = {
          id: wheelId,
          foods: {},
          spinning: false,
          result: null,
          history: [],
          createdAt: Date.now()
        };
        
        // 保存新转盘数据
        await env.FOOD_KV.put(`wheel:${wheelId}`, JSON.stringify(wheelData));
        
        // 更新最新转盘ID
        await env.FOOD_KV.put('latest_wheel_id', wheelId);
        
        // 触发全局刷新通知
        await env.FOOD_KV.put('refresh_trigger', Date.now().toString());
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/api/latest' && request.method === 'GET') {
        const latestWheelId = await env.FOOD_KV.get('latest_wheel_id');
        if (!latestWheelId) {
          return new Response(JSON.stringify({ error: 'No wheel found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const wheelData = await env.FOOD_KV.get(`wheel:${latestWheelId}`);
        if (!wheelData) {
          return new Response(JSON.stringify({ error: 'Wheel data not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response(wheelData, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/api/refresh-check' && request.method === 'GET') {
        const refreshTrigger = await env.FOOD_KV.get('refresh_trigger');
        return new Response(JSON.stringify({ 
          refreshTrigger: refreshTrigger || '0' 
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname.startsWith('/api/wheel/')) {
        const wheelId = url.pathname.split('/')[3];
        
        if (request.method === 'GET') {
          const data = await env.FOOD_KV.get(`wheel:${wheelId}`);
          if (!data) {
            return new Response(JSON.stringify({ error: 'Wheel not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          return new Response(data, {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (request.method === 'POST') {
          const { action, food, userId } = await request.json();
          const data = JSON.parse(await env.FOOD_KV.get(`wheel:${wheelId}`) || '{}');
          
          if (action === 'addFood') {
            // 生成唯一的食物ID，允许同一种食物多次添加
            const foodId = generateId();
            data.foods[foodId] = { food, userId };
          } else if (action === 'spin') {
            data.spinning = true;
            data.result = null;
          } else if (action === 'result') {
            data.spinning = false;
            data.result = food;
            data.history.push({
              result: food,
              timestamp: Date.now()
            });
          }
          
          await env.FOOD_KV.put(`wheel:${wheelId}`, JSON.stringify(data));
          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}function 
getHTML() {
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
    </div>    <scr
ipt>
        let currentWheelId = null;
        let userId = localStorage.getItem('userId') || generateId();
        let wheelData = null;
        let isSpinning = false;
        let pollInterval = null;
        let refreshCheckInterval = null;
        let lastRefreshTrigger = localStorage.getItem('lastRefreshTrigger') || '0';
        let privilegeMode = false;
        
        localStorage.setItem('userId', userId);
        
        function generateId() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        
        // 页面加载时自动连接最新转盘
        window.addEventListener('DOMContentLoaded', async () => {
            await connectToLatestWheel();
            startRefreshCheck();
        });
        
        async function connectToLatestWheel() {
            try {
                document.getElementById('connectionStatus').innerHTML = '<p>🔄 正在连接最新转盘...</p>';
                
                const response = await fetch('/api/latest');
                if (response.ok) {
                    const data = await response.json();
                    currentWheelId = data.id;
                    wheelData = data;
                    
                    document.getElementById('connectionStatus').innerHTML = '<p>✅ 已连接到最新转盘</p>';
                    showGameArea();
                    startPolling();
                } else {
                    document.getElementById('connectionStatus').innerHTML = '<p>❌ 暂无可用转盘，请初始化新转盘</p>';
                }
            } catch (error) {
                document.getElementById('connectionStatus').innerHTML = '<p>❌ 连接失败，请检查网络</p>';
                console.error('连接失败:', error);
            }
        }
        
        async function initWheel() {
            try {
                document.getElementById('connectionStatus').innerHTML = '<p>🔄 正在初始化新转盘...</p>';
                
                const response = await fetch('/api/init', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    // 清除当前用户的食物记录
                    if (currentWheelId) {
                        localStorage.removeItem(\`userFood_\${currentWheelId}\`);
                    }
                    
                    // 重新连接到最新转盘
                    await connectToLatestWheel();
                } else {
                    alert('初始化失败');
                }
            } catch (error) {
                alert('初始化失败: ' + error.message);
            }
        }
        
        // 检查是否需要刷新连接
        async function checkForRefresh() {
            try {
                const response = await fetch('/api/refresh-check');
                if (response.ok) {
                    const data = await response.json();
                    if (data.refreshTrigger !== lastRefreshTrigger) {
                        lastRefreshTrigger = data.refreshTrigger;
                        localStorage.setItem('lastRefreshTrigger', lastRefreshTrigger);
                        
                        // 如果当前用户不是触发刷新的用户，则重新连接
                        await connectToLatestWheel();
                    }
                }
            } catch (error) {
                console.error('刷新检查失败:', error);
            }
        }
        
        function startRefreshCheck() {
            if (refreshCheckInterval) clearInterval(refreshCheckInterval);
            refreshCheckInterval = setInterval(checkForRefresh, 3000);
        }
        
        function showGameArea() {
            document.getElementById('gameArea').style.display = 'block';
            
            if (privilegeMode) {
                showPrivilegeMode();
            } else {
                const userFood = localStorage.getItem(\`userFood_\${currentWheelId}\`);
                if (userFood) {
                    showUserFood(userFood);
                } else {
                    showFoodInput();
                }
            }
        }
        
        function showFoodInput() {
            document.getElementById('foodInput').style.display = 'block';
            document.getElementById('userFood').style.display = 'none';
            document.getElementById('privilegeFoods').style.display = 'none';
        }
        
        function showUserFood(food) {
            document.getElementById('foodInput').style.display = 'none';
            document.getElementById('userFood').style.display = 'block';
            document.getElementById('privilegeFoods').style.display = 'none';
            document.getElementById('currentFood').textContent = food;
        }
        
        function editFood() {
            document.getElementById('foodName').value = document.getElementById('currentFood').textContent;
            showFoodInput();
        }
        
        async function addFood() {
            const food = document.getElementById('foodName').value.trim();
            if (!food) {
                alert('请输入食物名称');
                return;
            }
            
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addFood',
                        food: food,
                        userId: userId
                    })
                });
                
                if (response.ok) {
                    localStorage.setItem(\`userFood_\${currentWheelId}\`, food);
                    showUserFood(food);
                    document.getElementById('foodName').value = '';
                    updateWheel();
                } else {
                    alert('添加失败');
                }
            } catch (error) {
                alert('添加失败: ' + error.message);
            }
        }
        
        // 特权模式相关功能
        function togglePrivilegeMode() {
            const toggle = document.getElementById('privilegeToggle');
            const input = document.getElementById('privilegeInput');
            
            if (!privilegeMode) {
                // 显示密码输入框
                input.style.display = 'block';
                document.getElementById('privilegePassword').focus();
                
                // 监听密码输入
                const passwordInput = document.getElementById('privilegePassword');
                passwordInput.addEventListener('input', function(e) {
                    if (e.target.value === '627') {
                        // 密码正确，激活特权模式
                        privilegeMode = true;
                        toggle.classList.add('active');
                        input.style.display = 'none';
                        showPrivilegeMode();
                        e.target.value = '';
                    } else if (e.target.value.length >= 3) {
                        // 密码错误
                        e.target.value = '';
                        e.target.placeholder = '密码错误';
                        setTimeout(() => {
                            e.target.placeholder = '密码';
                            input.style.display = 'none';
                        }, 1000);
                    }
                });
            } else {
                // 关闭特权模式
                privilegeMode = false;
                toggle.classList.remove('active');
                hidePrivilegeMode();
            }
        }
        
        function showPrivilegeMode() {
            document.getElementById('privilegeFoods').style.display = 'block';
            document.getElementById('foodInput').style.display = 'none';
            document.getElementById('userFood').style.display = 'none';
        }
        
        function hidePrivilegeMode() {
            document.getElementById('privilegeFoods').style.display = 'none';
            // 恢复正常模式显示
            const userFood = localStorage.getItem(\`userFood_\${currentWheelId}\`);
            if (userFood) {
                showUserFood(userFood);
            } else {
                showFoodInput();
            }
        }
        
        async function addPrivilegeFood() {
            const food = document.getElementById('privilegeFoodName').value.trim();
            if (!food) {
                alert('请输入食物名称');
                return;
            }
            
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addFood',
                        food: food,
                        userId: 'privilege_' + userId // 特权模式标识
                    })
                });
                
                if (response.ok) {
                    document.getElementById('privilegeFoodName').value = '';
                    updateWheel();
                } else {
                    alert('添加失败');
                }
            } catch (error) {
                alert('添加失败: ' + error.message);
            }
        }
        
        async function clearAllFoods() {
            if (!confirm('确定要清空所有食物吗？此操作不可撤销！')) {
                return;
            }
            
            try {
                // 重新初始化转盘来清空所有食物
                await initWheel();
            } catch (error) {
                alert('清空失败: ' + error.message);
            }
        }
        
        async function spinWheel() {
            if (isSpinning) return;
            
            try {
                await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'spin'
                    })
                });
                
                // 开始转动动画
                startSpinAnimation();
                
                // 随机转动时间 3-5秒
                const spinTime = 3000 + Math.random() * 2000;
                
                setTimeout(async () => {
                    const foods = Object.values(wheelData.foods);
                    const result = foods[Math.floor(Math.random() * foods.length)].food;
                    
                    await fetch(\`/api/wheel/\${currentWheelId}\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'result',
                            food: result
                        })
                    });
                    
                    stopSpinAnimation();
                    updateWheel();
                }, spinTime);
                
            } catch (error) {
                alert('转动失败: ' + error.message);
            }
        }
        
        function startSpinAnimation() {
            isSpinning = true;
            document.getElementById('spinBtn').disabled = true;
            document.getElementById('result').innerHTML = '<span class="spinning">转动中...</span>';
            
            const wheel = document.getElementById('wheel');
            let rotation = 0;
            const spinInterval = setInterval(() => {
                rotation += 10 + Math.random() * 20;
                wheel.style.transform = \`rotate(\${rotation}deg)\`;
            }, 50);
            
            window.spinInterval = spinInterval;
        }
        
        function stopSpinAnimation() {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            clearInterval(window.spinInterval);
        }
        
        async function updateWheel() {
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`);
                wheelData = await response.json();
                
                renderWheel();
                renderFoodList();
                renderHistory();
                updateResult();
                updateSpinButton();
                
            } catch (error) {
                console.error('更新失败:', error);
            }
        }
        
        // 优化转盘渲染函数
        function renderWheel() {
            const wheel = document.getElementById('wheel');
            const foods = Object.values(wheelData.foods);
            
            if (foods.length === 0) {
                wheel.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">暂无食物</div>';
                return;
            }
            
            wheel.innerHTML = '';
            
            // 更丰富的颜色数组，支持更多食物
            const colors = [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
                '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348', '#2ed573',
                '#3742fa', '#f368e0', '#ff9f43', '#0abde3', '#ee5a52',
                '#10ac84', '#5f27cd', '#00d2d3', '#ff9ff3', '#54a0ff'
            ];
            
            const segmentAngle = 360 / foods.length;
            
            foods.forEach((item, index) => {
                const segment = document.createElement('div');
                segment.className = 'wheel-segment';
                segment.style.backgroundColor = colors[index % colors.length];
                
                // 计算每个扇形的角度和位置
                const startAngle = segmentAngle * index;
                
                // 使用更精确的扇形绘制
                segment.style.transform = \`rotate(\${startAngle}deg)\`;
                
                // 根据食物数量调整字体大小和布局
                let fontSize = '16px';
                if (foods.length > 8) fontSize = '14px';
                if (foods.length > 12) fontSize = '12px';
                if (foods.length > 16) fontSize = '10px';
                if (foods.length > 20) fontSize = '9px';
                
                // 创建扇形的clip-path
                const angle = segmentAngle * Math.PI / 180;
                const x = Math.cos(angle) * 100;
                const y = Math.sin(angle) * 100;
                segment.style.clipPath = \`polygon(0 0, \${x}% \${y}%, 0 100%)\`;
                
                segment.innerHTML = \`<div class="wheel-segment-text" style="font-size: \${fontSize};">\${item.food}</div>\`;
                
                wheel.appendChild(segment);
            });
        }
        
        function renderFoodList() {
            const foodList = document.getElementById('foodList');
            const foods = Object.values(wheelData.foods);
            
            if (foods.length === 0) {
                foodList.innerHTML = '<p>暂无食物</p>';
                return;
            }
            
            // 统计每种食物的数量
            const foodCounts = {};
            foods.forEach(item => {
                foodCounts[item.food] = (foodCounts[item.food] || 0) + 1;
            });
            
            foodList.innerHTML = Object.entries(foodCounts).map(([food, count]) => 
                \`<span class="food-item">\${food} (\${count}次)</span>\`
            ).join('');
        }
        
        function renderHistory() {
            const historyList = document.getElementById('historyList');
            
            if (!wheelData.history || wheelData.history.length === 0) {
                historyList.innerHTML = '<p>暂无历史记录</p>';
                return;
            }
            
            historyList.innerHTML = wheelData.history.slice(-10).reverse().map(item => 
                \`<div class="history-item">
                    <span>\${item.result}</span>
                    <span>\${new Date(item.timestamp).toLocaleString()}</span>
                </div>\`
            ).join('');
        }
        
        function updateResult() {
            const result = document.getElementById('result');
            if (wheelData.spinning) {
                result.innerHTML = '<span class="spinning">转动中...</span>';
            } else if (wheelData.result) {
                result.innerHTML = \`🎉 结果: <strong>\${wheelData.result}</strong>\`;
            } else {
                result.innerHTML = '';
            }
        }
        
        function updateSpinButton() {
            const spinBtn = document.getElementById('spinBtn');
            const foods = Object.values(wheelData.foods);
            spinBtn.disabled = foods.length === 0 || wheelData.spinning;
        }
        
        function startPolling() {
            if (pollInterval) clearInterval(pollInterval);
            
            updateWheel();
            pollInterval = setInterval(updateWheel, 2000);
        }
        
        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            if (pollInterval) clearInterval(pollInterval);
            if (refreshCheckInterval) clearInterval(refreshCheckInterval);
        });
    </script>
</body>
</html>\`;
}