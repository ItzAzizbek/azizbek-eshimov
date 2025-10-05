import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfQK0tvsnMUSG9ItP3t2Ejh1mnV1tStv4",
  authDomain: "eshimov-azizbek.firebaseapp.com",
  projectId: "eshimov-azizbek",
  storageBucket: "eshimov-azizbek.firebasestorage.app",
  messagingSenderId: "214963058663",
  appId: "1:214963058663:web:97dc951037ef2872622f42",
  measurementId: "G-DQ2CHSH3KF",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

const topicsCount = document.getElementById("topicsCount");
const commentsCount = document.getElementById("commentsCount");
const usersCount = document.getElementById("usersCount");
const leaderboardList = document.getElementById("leaderboardList");
const recentTopicsList = document.getElementById("recentTopicsList");
const topicList = document.getElementById("topicList");
const createTopicBtn = document.getElementById("createTopicBtn");
const createTopicModal = document.getElementById("createTopicModal");
const closeTopicModal = document.getElementById("closeTopicModal");
const createTopicForm = document.getElementById("createTopicForm");
const categoryBtns = document.querySelectorAll(".category-btn");
const userMenu = document.getElementById("userMenu");
const dropdownMenu = document.getElementById("dropdownMenu");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const loginForm = document.getElementById("loginForm");
const signupModal = document.getElementById("signupModal");
const closeSignupModal = document.getElementById("closeSignupModal");
const signupForm = document.getElementById("signupForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

async function initForum() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    updateUserUI(user);
    updateForumStats();
    updateLeaderboard();
    updateRecentTopics();
    updateTopicList();
    setupForumEventListeners();
  });
}

function updateUserUI(user) {
  if (user) {
    getDoc(doc(db, "users", user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        userName.textContent = userData.fullName || "User";
        userAvatar.textContent = userData.fullName
          ? userData.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
          : "U";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
      }
    });
  }
}

async function updateForumStats() {
  const topicsSnapshot = await getDocs(collection(db, "topics"));
  const commentsSnapshot = await getDocs(collection(db, "comments"));
  const usersSnapshot = await getDocs(collection(db, "users"));

  topicsCount.textContent = topicsSnapshot.size;
  commentsCount.textContent = commentsSnapshot.size;
  usersCount.textContent = usersSnapshot.size;
}

async function updateLeaderboard() {
  const q = query(
    collection(db, "users"),
    orderBy("exp", "desc"),
    limit(5)
  );
  const querySnapshot = await getDocs(q);
  leaderboardList.innerHTML = "";

  querySnapshot.forEach((doc, index) => {
    const user = doc.data();
    const leaderboardItem = document.createElement("div");
    leaderboardItem.className = "leaderboard-item";
    leaderboardItem.innerHTML = `
          <div class="leaderboard-rank ${
            index < 3 ? `rank-${index + 1}` : ""
          }">${index + 1}</div>
          <div class="user-avatar-small">${user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")}</div>
          <div style="flex: 1;">
              <div style="font-weight: 500;">${user.fullName}</div>
              <div style="font-size: 0.7rem; color: #777;">${
                user.exp || 0
              } EXP</div>
          </div>
      `;
    leaderboardList.appendChild(leaderboardItem);
  });
}

async function updateRecentTopics() {
  const q = query(
    collection(db, "topics"),
    orderBy("date", "desc"),
    limit(5)
  );
  const querySnapshot = await getDocs(q);
  recentTopicsList.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const topic = doc.data();
    const topicItem = document.createElement("div");
    topicItem.className = "recent-topic-item";
    topicItem.innerHTML = `
          <div class="user-avatar-small">${topic.authorInitials}</div>
          <div style="flex: 1;">
              <div style="font-weight: 500; font-size: 0.9rem;">${
                topic.title
              }</div>
              <div style="font-size: 0.7rem; color: #777;">${formatTimestamp(
                topic.date
              )}</div>
          </div>
      `;
    recentTopicsList.appendChild(topicItem);
  });
}

async function updateTopicList(category = "all") {
  let q = collection(db, "topics");
  if (category !== "all") {
    q = query(q, where("category", "==", category));
  }
  q = query(q, orderBy("date", "desc"));

  const querySnapshot = await getDocs(q);
  topicList.innerHTML = "";

  if (querySnapshot.empty) {
    topicList.innerHTML =
      '<p style="text-align: center; color: #777; padding: 40px;">No topics found in this category.</p>';
    return;
  }

  const currentUser = auth.currentUser;
  const topicPromises = querySnapshot.docs.map(async (docSnap) => {
    const topic = docSnap.data();
    topic.id = docSnap.id;

    const commentsQuery = query(
      collection(db, "comments"),
      where("topicId", "==", topic.id)
    );

    const [commentsSnapshot, voteDocSnap] = await Promise.all([
      getDocs(commentsQuery),
      currentUser ? getDoc(doc(db, "votes", `${currentUser.uid}_${topic.id}`)) : Promise.resolve(null)
    ]);

    let userVote = null;
    if (voteDocSnap && voteDocSnap.exists()) {
      userVote = voteDocSnap.data().voteType;
    }

    const topicItem = document.createElement("div");
    topicItem.className = "topic-item";
    topicItem.dataset.id = topic.id;
    topicItem.innerHTML = `
      <div class="topic-votes">
        <div class="vote-count">${topic.votes || 0}</div>
        <div class="vote-buttons">
          <button class="vote-btn up ${userVote === "up" ? "upvoted" : ""}" data-id="${topic.id}" data-type="up">
            <i class="fas fa-chevron-up"></i>
          </button>
          <button class="vote-btn down ${userVote === "down" ? "downvoted" : ""}" data-id="${topic.id}" data-type="down">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="topic-content">
        <h3 class="topic-title">${topic.title}</h3>
        <p class="topic-excerpt">${topic.excerpt}</p>
        <div class="topic-meta">
          <div class="topic-author">
            <div class="author-avatar">${topic.authorInitials}</div>
            <span>${topic.author}</span>
          </div>
          <div><i class="far fa-comment"></i> ${commentsSnapshot.size} comments</div>
          <div>${formatTimestamp(topic.date)}</div>
        </div>
        <div class="topic-tags">
          ${topic.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
    `;

    return topicItem;
  });

  const topicItems = await Promise.all(topicPromises);
  topicItems.forEach((item) => topicList.appendChild(item));

  document.querySelectorAll(".topic-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".vote-btn")) {
        const topicId = item.dataset.id;
        openTopicDetail(topicId);
      }
    });
  });

  document.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", handleVote);
  });
}

function formatTimestamp(firebaseTimestamp) {
  if (!firebaseTimestamp) return "Just now";
  const date = firebaseTimestamp.toDate();
  const now = new Date();
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  if (diff < 7) return `${Math.floor(diff)} days ago`;
  return `${Math.floor(diff / 7)} week${
    Math.floor(diff / 7) > 1 ? "s" : ""
  } ago`;
}

async function handleVote(e) {
  e.stopPropagation();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    loginModal.style.display = "flex";
    return;
  }

  const topicId = e.target.closest(".vote-btn").dataset.id;
  const voteType = e.target.closest(".vote-btn").dataset.type;
  const topicRef = doc(db, "topics", topicId);
  const voteRef = doc(db, "votes", `${currentUser.uid}_${topicId}`);

  const topicSnap = await getDoc(topicRef);
  if (!topicSnap.exists()) return;

  const topic = topicSnap.data();
  const voteSnap = await getDoc(voteRef);
  let votes = topic.votes || 0;

  if (voteSnap.exists()) {
    const existingVote = voteSnap.data().voteType;
    if (existingVote === "up") {
      votes--;
    } else if (existingVote === "down") {
      votes++;
    }
    if (existingVote === voteType) {
      await updateDoc(topicRef, { votes });
      await deleteDoc(voteRef);
    } else {
      await updateDoc(voteRef, { voteType });
      votes += voteType === "up" ? 1 : -1;
      await updateDoc(topicRef, { votes });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { exp: increment(1) });

      if (voteType === "up") {
        const authorRef = doc(db, "users", topic.authorId);
        await updateDoc(authorRef, { exp: increment(2) });
      }
    }
  } else {
    await setDoc(voteRef, { voteType, userId: currentUser.uid, topicId });
    votes += voteType === "up" ? 1 : -1;
    await updateDoc(topicRef, { votes });

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { exp: increment(1) });

    if (voteType === "up") {
      const authorRef = doc(db, "users", topic.authorId);
      await updateDoc(authorRef, { exp: increment(2) });
    }
  }

  updateTopicList(getActiveCategory());
}

function getActiveCategory() {
  const activeBtn = document.querySelector(".category-btn.active");
  return activeBtn ? activeBtn.dataset.category : "all";
}

function openTopicDetail(topicId) {
  window.location.href = `topic.html?id=${topicId}`;
}

function setupForumEventListeners() {
  // Topic creation modal
  createTopicBtn.addEventListener("click", () => {
    createTopicModal.style.display = "flex";
  });

  closeTopicModal.addEventListener("click", () => {
    createTopicModal.style.display = "none";
  });

  // Category filtering
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateTopicList(btn.dataset.category);
    });
  });

  // Topic form submission
  createTopicForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      loginModal.style.display = "flex";
      return;
    }

    const title = document.getElementById("topicTitle").value;
    const category = document.getElementById("topicCategory").value;
    const content = document.getElementById("topicContent").value;
    const tags = document
      .getElementById("topicTags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userSnap.data();

    const newTopic = {
      title,
      excerpt: content.substring(0, 100) + "...",
      content,
      author: userData.fullName,
      authorInitials: userData.fullName
        .split(" ")
        .map((n) => n[0])
        .join(""),
      authorId: currentUser.uid,
      category,
      tags,
      votes: 0,
      date: new Date(),
      comments: 0,
    };

    await addDoc(collection(db, "topics"), newTopic);

    await updateDoc(doc(db, "users", currentUser.uid), {
      exp: increment(10),
      topics: increment(1),
    });

    createTopicModal.style.display = "none";
    createTopicForm.reset();
    updateForumStats();
    updateRecentTopics();
    updateTopicList(getActiveCategory());
    alert("Topic created successfully! You earned 10 EXP.");
  });

  // User dropdown menu
  userMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });

  // Login/Logout functionality
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "flex";
    dropdownMenu.classList.remove("show");
  });

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      await signOut(auth);
      window.location.href = "index.html";
    }
  });

  // Modal controls
  closeLoginModal.addEventListener("click", () => {
    loginModal.style.display = "none";
  });

  closeSignupModal.addEventListener("click", () => {
    signupModal.style.display = "none";
  });

  showSignup.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "none";
    signupModal.style.display = "flex";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.style.display = "none";
    loginModal.style.display = "flex";
  });

  // Login form
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginModal.style.display = "none";
      loginForm.reset();
      alert("Logged in successfully!");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });

  // Signup form
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        exp: 0,
        topics: 0,
        comments: 0,
      });

      signupModal.style.display = "none";
      signupForm.reset();
      alert("Account created successfully!");
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  });

  // Close modals and dropdown when clicking outside
  window.addEventListener("click", (e) => {
    // Close modals
    if (e.target === createTopicModal) {
      createTopicModal.style.display = "none";
    }
    if (e.target === loginModal) {
      loginModal.style.display = "none";
    }
    if (e.target === signupModal) {
      signupModal.style.display = "none";
    }

    // Close dropdown when clicking outside
    if (!userMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  });

  // Close dropdown when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdownMenu.classList.remove("show");
    }
  });
}

document.addEventListener("DOMContentLoaded", initForum);