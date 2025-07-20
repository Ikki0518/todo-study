const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('本番環境にアクセス中...');
    await page.goto('https://todo-study-frontend.vercel.app/', { waitUntil: 'networkidle2' });
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'production-test-1.png' });
    console.log('初期画面のスクリーンショットを撮影しました');
    
    // ページのタイトルを確認
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // ログインボタンを探してクリック
    const loginButtons = await page.$$('button');
    let loginButton = null;
    for (const button of loginButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('ログイン')) {
        loginButton = button;
        break;
      }
    }
    
    if (loginButton) {
      await loginButton.click();
      console.log('ログインボタンをクリックしました');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // テスト用のログイン情報を入力
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type('ikki_y0518@icloud.com');
      console.log('メールアドレスを入力しました');
    }
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type('Ikki0518');
      console.log('パスワードを入力しました');
    }
    
    // ログインボタンをクリック
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log('ログインを実行しました');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // ログイン後のURL確認
    console.log('ログイン後のURL:', page.url());
    
    // ログイン後のスクリーンショット
    await page.screenshot({ path: 'production-test-after-login.png' });
    console.log('ログイン後のスクリーンショットを撮影しました');
    
    // ページ上のすべてのボタンとリンクを確認
    const allButtons = await page.$$eval('button', buttons =>
      buttons.map(btn => btn.textContent?.trim()).filter(text => text)
    );
    console.log('ページ上のボタン:', allButtons);
    
    const allLinks = await page.$$eval('a', links =>
      links.map(link => link.textContent?.trim()).filter(text => text)
    );
    console.log('ページ上のリンク:', allLinks);
    
    // 参考書管理画面に移動
    const links = await page.$$('a');
    let studyBookLink = null;
    for (const link of links) {
      const text = await link.evaluate(el => el.textContent);
      if (text.includes('参考書管理')) {
        studyBookLink = link;
        break;
      }
    }
    
    if (studyBookLink) {
      await studyBookLink.click();
      console.log('参考書管理画面に移動しました');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 参考書管理画面のスクリーンショット
      await page.screenshot({ path: 'production-test-studybook.png' });
      console.log('参考書管理画面のスクリーンショットを撮影しました');
    } else {
      console.log('❌ 参考書管理リンクが見つかりません');
    }
    
    // 参考書を追加ボタンをクリック
    const buttons = await page.$$('button');
    let addBookButton = null;
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('参考書を追加')) {
        addBookButton = button;
        break;
      }
    }
    
    if (addBookButton) {
      await addBookButton.click();
      console.log('参考書を追加ボタンをクリックしました');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 参考書名入力フィールドを探す（複数のセレクタで試行）
    const inputSelectors = [
      'input[name="title"]',
      'input[placeholder*="参考書名"]',
      'input[placeholder*="参考書"]',
      'input[name*="bookName"]',
      'input[name*="name"]',
      'input[type="text"]'
    ];
    
    let titleInput = null;
    for (const selector of inputSelectors) {
      titleInput = await page.$(selector);
      if (titleInput) {
        console.log(`✅ 入力フィールドが見つかりました (セレクタ: ${selector})`);
        break;
      }
    }
    
    if (titleInput) {
      // フィールドにフォーカスを当てる
      await titleInput.focus();
      console.log('入力フィールドにフォーカスしました');
      
      // 既存の値をクリア
      await titleInput.evaluate(el => el.value = '');
      
      // テキストを入力してみる
      await titleInput.type('テスト参考書', { delay: 100 });
      console.log('テキストを入力しました');
      
      // 入力された値を確認
      const inputValue = await titleInput.evaluate(el => el.value);
      console.log('入力された値:', inputValue);
      
      if (inputValue === 'テスト参考書') {
        console.log('✅ 参考書名入力フィールドは正常に動作しています');
      } else {
        console.log('❌ 参考書名入力フィールドに問題があります');
        console.log('期待値: テスト参考書');
        console.log('実際の値:', inputValue);
      }
    } else {
      console.log('❌ 参考書名入力フィールドが見つかりません');
      
      // ページのHTML構造を確認
      const bodyHTML = await page.$eval('body', el => el.innerHTML);
      console.log('ページのHTML構造（最初の1000文字）:', bodyHTML.substring(0, 1000));
    }
    
    // 最終スクリーンショットを撮影
    await page.screenshot({ path: 'production-test-final.png' });
    console.log('最終スクリーンショットを撮影しました');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();