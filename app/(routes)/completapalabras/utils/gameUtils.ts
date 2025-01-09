import {  Word, Blank, } from '../components/types';

export const processText = (levelText: string) => {
    const blanks: Blank[] = [];
    const textParts: string[] = [];
    let currentText = '';
    let inBrackets = false;
    const correctWords: string[] = [];
  
    for (let i = 0; i < levelText.length; i++) {
      if (levelText[i] === '{') {
        inBrackets = true;
        textParts.push(currentText);
        currentText = '';
      } else if (levelText[i] === '}') {
        inBrackets = false;
        correctWords.push(currentText);
        blanks.push({
          id: `blank-${blanks.length}`,
          correctWord: currentText,
        });
        currentText = '';
      } else {
        currentText += levelText[i];
      }
    }
    textParts.push(currentText);
  
    return { blanks, textParts, correctWords };
  };
  
  export const createWordsForLevel = (correctWords: string[], extraWords: string[]) => {
    const words: Word[] = [
      ...correctWords.map((word, index) => ({
        id: `correct-${index}`,
        text: word,
        isCorrect: true
      })),
      ...extraWords.map((word, index) => ({
        id: `extra-${index}`,
        text: word,
        isCorrect: false
      }))
    ];
    return words.sort(() => Math.random() - 0.5);
  };
  