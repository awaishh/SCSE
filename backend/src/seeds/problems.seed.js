import { Problem } from "../models/problem.model.js";

/**
 * Seed the problem bank with competitive programming problems.
 * Only seeds if the collection is empty. Safe to call on every server start.
 */
export const seedProblems = async () => {
  const count = await Problem.countDocuments();
  if (count > 0) {
    console.log(`[seed] Problem bank already has ${count} problems. Skipping.`);
    return;
  }

  const problems = [
    // ── EASY ──
    {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "Easy",
      difficultyRating: 1100,
      tags: ["Array", "Hash Map"],
      description:
        "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer as two space-separated indices (0-indexed).",
      constraints: "2 ≤ nums.length ≤ 10⁴\n-10⁹ ≤ nums[i] ≤ 10⁹",
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
        { input: "nums = [3,2,4], target = 6", output: "1 2", explanation: "nums[1] + nums[2] = 2 + 4 = 6" },
      ],
      testCases: [
        { input: "4\n2 7 11 15\n9", expectedOutput: "0 1\n", isHidden: false },
        { input: "3\n3 2 4\n6", expectedOutput: "1 2\n", isHidden: false },
        { input: "2\n3 3\n6", expectedOutput: "0 1\n", isHidden: true },
        { input: "5\n1 5 3 7 2\n9", expectedOutput: "1 3\n", isHidden: true },
      ],
      starterCode: {
        javascript: `// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const nums = lines[1].split(' ').map(Number);
  const target = parseInt(lines[2]);
  // Your solution here
});`,
        python: `import sys
input_data = sys.stdin.read().split()
n = int(input_data[0])
nums = list(map(int, input_data[1:n+1]))
target = int(input_data[n+1])
# Your solution here
`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, target;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cin >> target;
    // Your solution here
    return 0;
}`,
        java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        // Your solution here
    }
}`,
      },
    },
    {
      title: "Reverse String",
      slug: "reverse-string",
      difficulty: "Easy",
      difficultyRating: 1100,
      tags: ["String", "Two Pointers"],
      description:
        "Given a string `s`, reverse it and print the result.",
      constraints: "1 ≤ s.length ≤ 10⁵",
      examples: [
        { input: 's = "hello"', output: "olleh" },
        { input: 's = "world"', output: "dlrow" },
      ],
      testCases: [
        { input: "hello", expectedOutput: "olleh\n", isHidden: false },
        { input: "world", expectedOutput: "dlrow\n", isHidden: false },
        { input: "abcde", expectedOutput: "edcba\n", isHidden: true },
        { input: "a", expectedOutput: "a\n", isHidden: true },
      ],
      starterCode: {
        javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', s => {\n  // Your solution here\n});`,
        python: `s = input()\n# Your solution here\n`,
        cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    cin >> s;\n    // Your solution here\n    return 0;\n}`,
        java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        // Your solution here\n    }\n}`,
      },
    },
    {
      title: "FizzBuzz",
      slug: "fizzbuzz",
      difficulty: "Easy",
      difficultyRating: 1100,
      tags: ["Math", "String"],
      description:
        'Given an integer `n`, print numbers from 1 to n. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".',
      constraints: "1 ≤ n ≤ 10⁴",
      examples: [
        { input: "n = 5", output: "1\n2\nFizz\n4\nBuzz" },
      ],
      testCases: [
        { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz\n", isHidden: false },
        { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n", isHidden: true },
      ],
      starterCode: {
        javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', line => {\n  const n = parseInt(line);\n  // Your solution here\n});`,
        python: `n = int(input())\n# Your solution here\n`,
        cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    // Your solution here\n    return 0;\n}`,
        java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int n = new Scanner(System.in).nextInt();\n        // Your solution here\n    }\n}`,
      },
    },

    // ── MEDIUM ──
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: "Medium",
      difficultyRating: 1300,
      tags: ["Stack", "String"],
      description:
        'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nPrint "true" or "false".',
      constraints: "1 ≤ s.length ≤ 10⁴",
      examples: [
        { input: 's = "()"', output: "true" },
        { input: 's = "([)]"', output: "false" },
      ],
      testCases: [
        { input: "()", expectedOutput: "true\n", isHidden: false },
        { input: "()[]{}", expectedOutput: "true\n", isHidden: false },
        { input: "(]", expectedOutput: "false\n", isHidden: true },
        { input: "([)]", expectedOutput: "false\n", isHidden: true },
        { input: "{[]}", expectedOutput: "true\n", isHidden: true },
      ],
      starterCode: {
        javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', s => {\n  // Your solution here\n});`,
        python: `s = input()\n# Your solution here\n`,
        cpp: `#include <iostream>\n#include <stack>\nusing namespace std;\nint main() {\n    string s;\n    cin >> s;\n    // Your solution here\n    return 0;\n}`,
        java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String s = new Scanner(System.in).next();\n        // Your solution here\n    }\n}`,
      },
    },
    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-no-repeat",
      difficulty: "Medium",
      difficultyRating: 1400,
      tags: ["Sliding Window", "Hash Map"],
      description:
        "Given a string `s`, find the length of the longest substring without repeating characters. Print the length as an integer.",
      constraints: "0 ≤ s.length ≤ 5 × 10⁴",
      examples: [
        { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with length 3.' },
        { input: 's = "bbbbb"', output: "1" },
      ],
      testCases: [
        { input: "abcabcbb", expectedOutput: "3\n", isHidden: false },
        { input: "bbbbb", expectedOutput: "1\n", isHidden: false },
        { input: "pwwkew", expectedOutput: "3\n", isHidden: true },
        { input: "", expectedOutput: "0\n", isHidden: true },
      ],
      starterCode: {
        javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on('line', s => {\n  // Your solution here\n});`,
        python: `s = input()\n# Your solution here\n`,
        cpp: `#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main() {\n    string s;\n    cin >> s;\n    // Your solution here\n    return 0;\n}`,
        java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String s = new Scanner(System.in).nextLine();\n        // Your solution here\n    }\n}`,
      },
    },

    // ── HARD ──
    {
      title: "Merge K Sorted Lists",
      slug: "merge-k-sorted-lists",
      difficulty: "Hard",
      difficultyRating: 1500,
      tags: ["Heap", "Linked List", "Divide & Conquer"],
      description:
        "You are given `k` sorted arrays of integers. Merge all arrays into one sorted array and print all elements space-separated.\n\nFirst line: k (number of arrays)\nNext k lines: each starts with the array size, followed by the elements.",
      constraints: "1 ≤ k ≤ 10⁴\nTotal elements ≤ 10⁵",
      examples: [
        { input: "k=3, arrays: [1,4,5], [1,3,4], [2,6]", output: "1 1 2 3 4 4 5 6" },
      ],
      testCases: [
        { input: "3\n3 1 4 5\n3 1 3 4\n2 2 6", expectedOutput: "1 1 2 3 4 4 5 6\n", isHidden: false },
        { input: "1\n1 0", expectedOutput: "0\n", isHidden: true },
        { input: "2\n3 1 2 3\n3 4 5 6", expectedOutput: "1 2 3 4 5 6\n", isHidden: true },
      ],
      starterCode: {
        javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n  const k = parseInt(lines[0]);\n  // Your solution here\n});`,
        python: `import sys\ndata = sys.stdin.read().split('\\n')\nk = int(data[0])\n# Your solution here\n`,
        cpp: `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    int k;\n    cin >> k;\n    // Your solution here\n    return 0;\n}`,
        java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int k = sc.nextInt();\n        // Your solution here\n    }\n}`,
      },
    },
  ];

  await Problem.insertMany(problems);
  console.log(`[seed] ✅ Seeded ${problems.length} problems into the bank.`);
};
