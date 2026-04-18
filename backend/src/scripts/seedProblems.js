import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import mongoose from "mongoose";
import { Problem } from "../models/problem.model.js";


const problems = [
  // ── STAGE 0: Easy (800-1100) ──
  {
    title: "Sum of Two Numbers",
    slug: "sum-of-two-numbers",
    difficulty: "Easy",
    tags: ["math"],
    description: "Given two integers A and B, print their sum.",
    constraints: "1 <= A, B <= 10^9",
    difficultyRating: 800,
    examples: [{ input: "3 5", output: "8", explanation: "3 + 5 = 8" }],
    testCases: [
      { input: "3 5", expectedOutput: "8", isHidden: false },
      { input: "0 0", expectedOutput: "0", isHidden: false },
      { input: "1000000000 1000000000", expectedOutput: "2000000000", isHidden: true },
      { input: "1 999999999", expectedOutput: "1000000000", isHidden: true },
    ],
    starterCode: {
      javascript: 'const [a, b] = require("fs").readFileSync("/dev/stdin","utf8").trim().split(" ").map(Number);\nconsole.log(a + b);',
      python: "a, b = map(int, input().split())\nprint(a + b)",
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){long long a,b;cin>>a>>b;cout<<a+b;return 0;}',
      java: 'import java.util.*;public class Main{public static void main(String[] a){Scanner s=new Scanner(System.in);System.out.println(s.nextLong()+s.nextLong());}}'
    }
  },
  {
    title: "Even or Odd",
    slug: "even-or-odd",
    difficulty: "Easy",
    tags: ["math"],
    description: "Given an integer N, print 'Even' if N is even, otherwise print 'Odd'.",
    constraints: "1 <= N <= 10^9",
    difficultyRating: 800,
    examples: [{ input: "4", output: "Even", explanation: "4 is divisible by 2" }],
    testCases: [
      { input: "4", expectedOutput: "Even", isHidden: false },
      { input: "7", expectedOutput: "Odd", isHidden: false },
      { input: "0", expectedOutput: "Even", isHidden: true },
      { input: "999999999", expectedOutput: "Odd", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Maximum of Three",
    slug: "maximum-of-three",
    difficulty: "Easy",
    tags: ["math", "implementation"],
    description: "Given three integers A, B, C, print the maximum value.",
    constraints: "-10^9 <= A, B, C <= 10^9",
    difficultyRating: 900,
    examples: [{ input: "1 2 3", output: "3", explanation: "3 is the largest" }],
    testCases: [
      { input: "1 2 3", expectedOutput: "3", isHidden: false },
      { input: "5 5 5", expectedOutput: "5", isHidden: false },
      { input: "-1 -2 -3", expectedOutput: "-1", isHidden: true },
      { input: "1000000000 999999999 1", expectedOutput: "1000000000", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  // ── STAGE 1: Medium-Easy (1100-1400) ──
  {
    title: "FizzBuzz",
    slug: "fizzbuzz",
    difficulty: "Easy",
    tags: ["implementation"],
    description: "Given N, for each number from 1 to N: print 'FizzBuzz' if divisible by both 3 and 5, 'Fizz' if by 3, 'Buzz' if by 5, else the number. One per line.",
    constraints: "1 <= N <= 100",
    difficultyRating: 1100,
    examples: [{ input: "5", output: "1\n2\nFizz\n4\nBuzz", explanation: "" }],
    testCases: [
      { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz", isHidden: false },
      { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", isHidden: false },
      { input: "1", expectedOutput: "1", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "Easy",
    tags: ["strings"],
    description: "Given a string S, print it reversed.",
    constraints: "1 <= |S| <= 10^5. S contains lowercase English letters.",
    difficultyRating: 1100,
    examples: [{ input: "hello", output: "olleh", explanation: "" }],
    testCases: [
      { input: "hello", expectedOutput: "olleh", isHidden: false },
      { input: "a", expectedOutput: "a", isHidden: false },
      { input: "abcdef", expectedOutput: "fedcba", isHidden: true },
      { input: "racecar", expectedOutput: "racecar", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Count Vowels",
    slug: "count-vowels",
    difficulty: "Easy",
    tags: ["strings", "implementation"],
    description: "Given a string S (lowercase), print the number of vowels (a, e, i, o, u).",
    constraints: "1 <= |S| <= 10^5",
    difficultyRating: 1200,
    examples: [{ input: "hello", output: "2", explanation: "e and o" }],
    testCases: [
      { input: "hello", expectedOutput: "2", isHidden: false },
      { input: "aeiou", expectedOutput: "5", isHidden: false },
      { input: "xyz", expectedOutput: "0", isHidden: true },
      { input: "programming", expectedOutput: "3", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  // ── STAGE 2: Medium (1400-1700) ──
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Medium",
    tags: ["arrays", "hash-map"],
    description: "Given N integers and a target T, find two distinct indices i and j (0-indexed) such that arr[i]+arr[j]=T. Print them space-separated (smaller first). A solution is guaranteed.",
    constraints: "2 <= N <= 10^5, -10^9 <= arr[i], T <= 10^9",
    difficultyRating: 1400,
    examples: [{ input: "4 9\n2 7 11 15", output: "0 1", explanation: "arr[0]+arr[1]=9" }],
    testCases: [
      { input: "4 9\n2 7 11 15", expectedOutput: "0 1", isHidden: false },
      { input: "3 6\n3 2 4", expectedOutput: "1 2", isHidden: false },
      { input: "2 6\n3 3", expectedOutput: "0 1", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Palindrome Check",
    slug: "palindrome-check",
    difficulty: "Medium",
    tags: ["strings"],
    description: "Given a string S (lowercase), print 'YES' if it is a palindrome, otherwise 'NO'.",
    constraints: "1 <= |S| <= 10^5",
    difficultyRating: 1400,
    examples: [{ input: "racecar", output: "YES", explanation: "" }],
    testCases: [
      { input: "racecar", expectedOutput: "YES", isHidden: false },
      { input: "hello", expectedOutput: "NO", isHidden: false },
      { input: "a", expectedOutput: "YES", isHidden: true },
      { input: "abba", expectedOutput: "YES", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Frequency Sort",
    slug: "frequency-sort",
    difficulty: "Medium",
    tags: ["sorting", "hash-map"],
    description: "Given N integers, print all unique elements sorted by frequency (most frequent first). Break ties by smaller value first.",
    constraints: "1 <= N <= 10^5",
    difficultyRating: 1500,
    examples: [{ input: "7\n4 5 6 5 4 3 4", output: "4 5 3 6", explanation: "4 appears 3x, 5 appears 2x, 3 and 6 appear 1x" }],
    testCases: [
      { input: "7\n4 5 6 5 4 3 4", expectedOutput: "4 5 3 6", isHidden: false },
      { input: "3\n1 1 1", expectedOutput: "1", isHidden: true },
      { input: "4\n3 2 1 4", expectedOutput: "1 2 3 4", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  // ── STAGE 3: Medium-Hard (1700-2000) ──
  {
    title: "Longest Increasing Subsequence Length",
    slug: "lis-length",
    difficulty: "Hard",
    tags: ["dp", "binary-search"],
    description: "Given N integers, find the length of the longest strictly increasing subsequence.",
    constraints: "1 <= N <= 10^5, -10^9 <= arr[i] <= 10^9",
    difficultyRating: 1700,
    examples: [{ input: "6\n10 9 2 5 3 7", output: "3", explanation: "[2,5,7] or [2,3,7]" }],
    testCases: [
      { input: "6\n10 9 2 5 3 7", expectedOutput: "3", isHidden: false },
      { input: "5\n1 2 3 4 5", expectedOutput: "5", isHidden: false },
      { input: "5\n5 4 3 2 1", expectedOutput: "1", isHidden: true },
      { input: "8\n0 1 0 3 2 3 4 5", expectedOutput: "6", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Medium",
    tags: ["stack", "strings"],
    description: "Given a string containing only '(', ')', '{', '}', '[', ']', print 'YES' if valid, 'NO' otherwise.",
    constraints: "1 <= |S| <= 10^5",
    difficultyRating: 1800,
    examples: [{ input: "()[]{}", output: "YES", explanation: "" }],
    testCases: [
      { input: "()[]{}", expectedOutput: "YES", isHidden: false },
      { input: "(]", expectedOutput: "NO", isHidden: false },
      { input: "({[]})", expectedOutput: "YES", isHidden: true },
      { input: "((()))", expectedOutput: "YES", isHidden: true },
      { input: ")(", expectedOutput: "NO", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "Medium",
    tags: ["sorting", "intervals"],
    description: "Given N intervals [start, end], merge overlapping ones. Print each merged interval on a separate line as 'start end', sorted by start.",
    constraints: "1 <= N <= 10^4, 0 <= start <= end <= 10^6",
    difficultyRating: 1900,
    examples: [{ input: "4\n1 3\n2 6\n8 10\n15 18", output: "1 6\n8 10\n15 18", explanation: "[1,3] and [2,6] merge into [1,6]" }],
    testCases: [
      { input: "4\n1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18", isHidden: false },
      { input: "2\n1 4\n4 5", expectedOutput: "1 5", isHidden: true },
      { input: "1\n1 1", expectedOutput: "1 1", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  // ── STAGE 4: Hard (2000-2400) ──
  {
    title: "Longest Common Subsequence",
    slug: "lcs",
    difficulty: "Hard",
    tags: ["dp", "strings"],
    description: "Given two strings A and B, print the length of their longest common subsequence.",
    constraints: "1 <= |A|, |B| <= 1000",
    difficultyRating: 2000,
    examples: [{ input: "abcde\nace", output: "3", explanation: "LCS is 'ace'" }],
    testCases: [
      { input: "abcde\nace", expectedOutput: "3", isHidden: false },
      { input: "abc\nabc", expectedOutput: "3", isHidden: false },
      { input: "abc\ndef", expectedOutput: "0", isHidden: true },
      { input: "abcba\nabcbcba", expectedOutput: "5", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Knapsack 0/1",
    slug: "knapsack-01",
    difficulty: "Hard",
    tags: ["dp"],
    description: "Given N items with weights and values, and capacity W, find the maximum value achievable. First line: N W. Next N lines: weight value.",
    constraints: "1 <= N <= 100, 1 <= W <= 10^4",
    difficultyRating: 2100,
    examples: [{ input: "3 50\n10 60\n20 100\n30 120", output: "220", explanation: "Take items 2 and 3" }],
    testCases: [
      { input: "3 50\n10 60\n20 100\n30 120", expectedOutput: "220", isHidden: false },
      { input: "1 1\n2 3", expectedOutput: "0", isHidden: false },
      { input: "4 7\n1 1\n3 4\n4 5\n5 7", expectedOutput: "9", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
  {
    title: "Shortest Path (Dijkstra)",
    slug: "shortest-path",
    difficulty: "Hard",
    tags: ["graphs", "dijkstra"],
    description: "Given a weighted directed graph with N nodes and M edges, find shortest distance from node 1 to node N. Print -1 if unreachable. Nodes are 1-indexed. Each edge: u v w.",
    constraints: "1 <= N <= 10^4, 0 <= M <= 10^5, 1 <= w <= 10^6",
    difficultyRating: 2200,
    examples: [{ input: "4 4\n1 2 1\n2 3 2\n3 4 3\n1 4 10", output: "6", explanation: "1→2→3→4 costs 1+2+3=6" }],
    testCases: [
      { input: "4 4\n1 2 1\n2 3 2\n3 4 3\n1 4 10", expectedOutput: "6", isHidden: false },
      { input: "2 0", expectedOutput: "-1", isHidden: true },
      { input: "1 0", expectedOutput: "0", isHidden: true },
    ],
    starterCode: { javascript: "", python: "", cpp: "", java: "" }
  },
];

async function seed() {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[seed] Connected to MongoDB");

    // Clear existing problems
    await Problem.deleteMany({});
    console.log("[seed] Cleared existing problems");

    // Insert all problems
    const inserted = await Problem.insertMany(problems);
    console.log(`[seed] Inserted ${inserted.length} problems:`);
    inserted.forEach((p) => console.log(`  - ${p.title} (${p.difficultyRating}) → ${p._id}`));

    process.exit(0);
  } catch (err) {
    console.error("[seed] Error:", err);
    process.exit(1);
  }
}

seed();
