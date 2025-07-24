export default {
  async fetch(request, env, ctx) {
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
        await env.FOOD_KV.put(`wheel:${wheelId}`, JSON.stringify({
          id: wheelId,
          foods: {},
          spinning: false,
          result: null,
          history: [],
          createdAt: Date.now()
        }));
        return new Response(JSON.stringify({ wheelId }), {
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
            if (!data.foods[userId]) {
              data.foods[userId] = { food, count: 1 };
            } else {
              data.foods[userId].food = food;
              data.foods[userId].count += 1;
            }
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
}

function getHTML() {
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
            max-width: 800px;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .wheel-container {
            position: relative;
            width: 400px;
            height: 400px;
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
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
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
                width: 300px;
                height: 300px;
            }
            
            input[type="text"] {
                width: 250px;
            }
            
            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍽️ 吃什么？摇一摇！</h1>
        
        <div class="controls">
            <div class="input-group">
                <input type="text" id="wheelIdInput" placeholder="输入转盘编号或留空创建新转盘">
                <button class="btn-primary" onclick="joinWheel()">加入转盘</button>
                <button class="btn-secondary" onclick="initWheel()">初始化新转盘</button>
            </div>
            
            <div id="wheelInfo" style="display: none;">
                <p>转盘编号: <strong id="currentWheelId"></strong></p>
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

    <script>
        let currentWheelId = null;
        let userId = localStorage.getItem('userId') || generateId();
        let wheelData = null;
        let isSpinning = false;
        let pollInterval = null;
        
        localStorage.setItem('userId', userId);
        
        function generateId() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        
        async function initWheel() {
            try {
                const response = await fetch('/api/init', {
                    method: 'POST'
                });
                const data = await response.json();
                currentWheelId = data.wheelId;
                localStorage.removeItem(\`userFood_\${currentWheelId}\`);
                showGameArea();
                startPolling();
            } catch (error) {
                alert('初始化失败: ' + error.message);
            }
        }
        
        async function joinWheel() {
            const wheelId = document.getElementById('wheelIdInput').value.trim();
            if (!wheelId) {
                await initWheel();
                return;
            }
            
            try {
                const response = await fetch(\`/api/wheel/\${wheelId}\`);
                if (response.ok) {
                    currentWheelId = wheelId;
                    showGameArea();
                    startPolling();
                } else {
                    alert('转盘不存在');
                }
            } catch (error) {
                alert('加入失败: ' + error.message);
            }
        }
        
        function showGameArea() {
            document.getElementById('wheelInfo').style.display = 'block';
            document.getElementById('currentWheelId').textContent = currentWheelId;
            document.getElementById('gameArea').style.display = 'block';
            
            const userFood = localStorage.getItem(\`userFood_\${currentWheelId}\`);
            if (userFood) {
                showUserFood(userFood);
            } else {
                showFoodInput();
            }
        }
        
        function showFoodInput() {
            document.getElementById('foodInput').style.display = 'block';
            document.getElementById('userFood').style.display = 'none';
        }
        
        function showUserFood(food) {
            document.getElementById('foodInput').style.display = 'none';
            document.getElementById('userFood').style.display = 'block';
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
                    const weightedFoods = [];
                    
                    foods.forEach(item => {
                        for (let i = 0; i < item.count; i++) {
                            weightedFoods.push(item.food);
                        }
                    });
                    
                    const result = weightedFoods[Math.floor(Math.random() * weightedFoods.length)];
                    
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
        
        function renderWheel() {
            const wheel = document.getElementById('wheel');
            const foods = Object.values(wheelData.foods);
            
            if (foods.length === 0) {
                wheel.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">暂无食物</div>';
                return;
            }
            
            wheel.innerHTML = '';
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
            
            foods.forEach((item, index) => {
                const segment = document.createElement('div');
                segment.className = 'wheel-segment';
                segment.style.backgroundColor = colors[index % colors.length];
                segment.style.transform = \`rotate(\${(360 / foods.length) * index}deg)\`;
                segment.style.clipPath = \`polygon(0 0, \${100 / foods.length * 100}% 0, 50% 100%)\`;
                segment.textContent = \`\${item.food} (\${item.count})\`;
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
            
            foodList.innerHTML = foods.map(item => 
                \`<span class="food-item">\${item.food} (权重: \${item.count})</span>\`
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
        });
    </script>
</body>
</html>`;
}