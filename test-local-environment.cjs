const puppeteer = require('puppeteer');

async function testLocalEnvironment() {
  console.log('ローカル環境にアクセス中...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // ローカル開発サーバーにアクセス
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // 初期画面のスクリーンショット
    await page.screenshot({ path: 'todo-study/local-test-1.png' });
    console.log('初期画面のスクリーンショットを撮影しました');
    
    // ページタイトルを確認
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // ログインボタンを探してクリック
    const loginButton = await page.$('button:has-text("ログイン")');
    if (loginButton) {
      await loginButton.click();
      console.log('ログインボタンをクリックしました');
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ ログインボタンが見つかりません');
    }
    
    // メールアドレス入力
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type('ikki_y0518@icloud.com');
      console.log('メールアドレスを入力しました');
    }
    
    // パスワード入力
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type('ikki0518');
      console.log('パスワードを入力しました');
    }
    
    // ログイン実行
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log('ログインを実行しました');
      await page.waitForTimeout(3000);
    }
    
    // ログイン後のURL確認
    const currentUrl = await page.url();
    console.log('ログイン後のURL:', currentUrl);
    
    // ログイン後のスクリーンショット
    await page.screenshot({ path: 'todo-study/local-test-after-login.png' });
    console.log('ログイン後のスクリーンショットを撮影しました');
    
    // ページ上のボタンを確認
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(button => button.textContent.trim()).filter(text => text)
    );
    console.log('ページ上のボタン:', buttons);
    
    // ページ上のリンクを確認
    const links = await page.$$eval('a', links => 
      links.map(link => link.textContent.trim()).filter(text => text)
    );
    console.log('ページ上のリンク:', links);
    
    // 参考書関連の要素を探す
    const studyBookElements = await page.$$eval('*', elements => 
      elements.filter(el => 
        el.textContent && (
          el.textContent.includes('参考書') || 
          el.textContent.includes('StudyBook') ||
          el.textContent.includes('学習計画')
        )
      ).map(el => el.textContent.trim())
    );
    console.log('参考書関連の要素:', studyBookElements);
    
    // 参考書管理リンクを探してクリック
    const studyBookLink = await page.$('a:has-text("参考書管理"), button:has-text("参考書管理")');
    if (studyBookLink) {
      console.log('✅ 参考書管理リンクが見つかりました');
      await studyBookLink.click();
      await page.waitForTimeout(2000);
      
      // 参考書管理画面のスクリーンショット
      await page.screenshot({ path: 'todo-study/local-test-studybook.png' });
      console.log('参考書管理画面のスクリーンショットを撮影しました');
      
      // 参考書名入力フィールドをテスト
      const bookNameInput = await page.$('input[placeholder*="参考書名"], input[placeholder*="書籍名"]');
      if (bookNameInput) {
        console.log('✅ 参考書名入力フィールドが見つかりました');
        await bookNameInput.click();
        await page.waitForTimeout(500);
        await bookNameInput.type('数学I・A 基礎問題精講');
        console.log('参考書名を入力しました');
        
        // 入力後のスクリーンショット
        await page.screenshot({ path: 'todo-study/local-test-input.png' });
        console.log('入力後のスクリーンショットを撮影しました');
      } else {
        console.log('❌ 参考書名入力フィールドが見つかりません');
      }
    } else {
      console.log('❌ 参考書管理リンクが見つかりません');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'todo-study/local-test-final.png' });
    console.log('最終スクリーンショットを撮影しました');
    
    // 5秒間待機してブラウザを閉じる
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

testLocalEnvironment();