const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('新しい本番環境にアクセス中...');
    await page.goto('https://todo-study-three.vercel.app/', { waitUntil: 'networkidle2' });
    
    // スクリーンショットを撮影
    await page.screenshot({ path: 'production-test-new-1.png' });
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
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // ログイン後のURL確認
    const currentUrl = page.url();
    console.log('ログイン後のURL:', currentUrl);
    
    // ログイン後のスクリーンショット
    await page.screenshot({ path: 'production-test-new-after-login.png' });
    console.log('ログイン後のスクリーンショットを撮影しました');
    
    // ページ上のボタンとリンクを確認
    const buttons = await page.$$eval('button', buttons => buttons.map(btn => btn.textContent.trim()));
    const links = await page.$$eval('a', links => links.map(link => link.textContent.trim()));
    console.log('ページ上のボタン:', buttons);
    console.log('ページ上のリンク:', links);
    
    // 参考書管理リンクを探す（より広範囲に検索）
    let studyBookElement = null;
    
    // まず、テキストに「参考書」を含む要素を探す
    const elementsWithStudyBook = await page.$$eval('*', elements => {
      return elements
        .filter(el => el.textContent && el.textContent.includes('参考書'))
        .map(el => ({
          tagName: el.tagName,
          textContent: el.textContent.trim(),
          className: el.className,
          id: el.id
        }));
    });
    
    console.log('参考書関連の要素:', elementsWithStudyBook);
    
    // 参考書管理要素をクリック
    if (elementsWithStudyBook.length > 0) {
      // 最初の参考書関連要素をクリック
      const firstStudyBookText = elementsWithStudyBook[0].textContent;
      studyBookElement = await page.evaluateHandle((text) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent && el.textContent.includes(text));
      }, firstStudyBookText);
      
      if (studyBookElement) {
        console.log('✅ 参考書管理要素が見つかりました');
        await studyBookElement.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 参考書管理画面のスクリーンショット
        await page.screenshot({ path: 'production-test-new-studybook.png' });
        console.log('参考書管理画面のスクリーンショットを撮影しました');
        
        // 参考書追加ボタンを探す
        const addButtons = await page.$$eval('button', buttons => {
          return buttons
            .filter(btn => btn.textContent && (btn.textContent.includes('追加') || btn.textContent.includes('参考書を追加')))
            .map(btn => btn.textContent.trim());
        });
        
        console.log('追加ボタン:', addButtons);
        
        if (addButtons.length > 0) {
          const addButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent && (btn.textContent.includes('追加') || btn.textContent.includes('参考書を追加')));
          });
          
          if (addButton) {
            console.log('✅ 参考書追加ボタンが見つかりました');
            await addButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 入力フィールドを探す
            const nameInput = await page.$('input[type="text"]');
            if (nameInput) {
              console.log('✅ 入力フィールドが見つかりました (セレクタ: input[type="text"])');
              
              // フォーカスしてテキスト入力を試行
              await nameInput.focus();
              console.log('入力フィールドにフォーカスしました');
              
              await nameInput.type('テスト参考書');
              console.log('テキストを入力しました');
              
              // 入力された値を確認
              const inputValue = await nameInput.evaluate(el => el.value);
              console.log('入力された値:', inputValue);
              
              if (inputValue === 'テスト参考書') {
                console.log('✅ 参考書名入力フィールドは正常に動作しています');
              } else {
                console.log('❌ 参考書名入力フィールドに問題があります');
                console.log('期待値: テスト参考書, 実際の値:', inputValue);
              }
            } else {
              console.log('❌ input[type="text"]が見つかりません');
              
              // 他の入力フィールドを探す
              const allInputs = await page.$$eval('input', inputs => {
                return inputs.map(input => ({
                  type: input.type,
                  placeholder: input.placeholder,
                  name: input.name,
                  id: input.id,
                  className: input.className
                }));
              });
              console.log('すべての入力フィールド:', allInputs);
            }
          }
        } else {
          console.log('❌ 参考書追加ボタンが見つかりません');
        }
      }
    } else {
      console.log('❌ 参考書管理リンクが見つかりません');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'production-test-new-final.png' });
    console.log('最終スクリーンショットを撮影しました');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();