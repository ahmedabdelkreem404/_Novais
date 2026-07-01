// User Model
class AppUser {
  final int id;
  final String name;
  final String email;
  final String? photoUrl;
  final bool darkMode;
  final bool isAdmin;
  final String? subscriptionType;
  final int? courseLimit;
  final bool emailVerified;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
    this.darkMode = true,
    this.isAdmin = false,
    this.subscriptionType,
    this.courseLimit,
    this.emailVerified = false,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      photoUrl: json['photo_url'] ?? json['photoURL'],
      darkMode: json['dark_mode'] ?? true,
      isAdmin: json['is_admin'] ?? false,
      subscriptionType: json['subscription_type'],
      courseLimit: json['course_limit'],
      emailVerified: json['email_verified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'photo_url': photoUrl,
        'dark_mode': darkMode,
        'is_admin': isAdmin,
      };

  bool get isPro => subscriptionType == 'pro' || subscriptionType == 'elite';
}

class SubscriptionUsage {
  final dynamic planName;
  final num? price;
  final int limit;
  final int used;
  final int remaining;
  final String? renewalDate;
  final num? monthlySpent;

  const SubscriptionUsage({
    this.planName,
    this.price,
    required this.limit,
    required this.used,
    required this.remaining,
    this.renewalDate,
    this.monthlySpent,
  });

  bool get isUnlimited => limit == -1;

  double get progress {
    if (isUnlimited || limit <= 0) return 0;
    return (used / limit).clamp(0, 1).toDouble();
  }

  factory SubscriptionUsage.fromJson(Map<String, dynamic> json) {
    int asInt(dynamic value, [int fallback = 0]) {
      if (value is int) return value;
      if (value is num) return value.toInt();
      return int.tryParse('$value') ?? fallback;
    }

    num? asNum(dynamic value) {
      if (value is num) return value;
      return num.tryParse('$value');
    }

    final used = asInt(json['used']);
    final remaining = asInt(json['remaining']);
    var limit = asInt(json['limit'], 1);
    if (limit == 0 && (used > 0 || remaining > 0)) {
      limit = used + remaining;
    }

    return SubscriptionUsage(
      planName: json['plan_name'],
      price: asNum(json['price']),
      limit: limit,
      used: used,
      remaining: remaining,
      renewalDate: json['renewal_date']?.toString(),
      monthlySpent: asNum(json['monthly_spent']),
    );
  }
}

// Quiz Question Model
class QuizQuestion {
  final int id;
  final String question;
  final List<String> options;
  final int correctIndex;
  final String? explanation;

  const QuizQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctIndex,
    this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final opts =
        (json['options'] as List? ?? []).map((o) => o.toString()).toList();
    return QuizQuestion(
      id: json['id'] ?? 0,
      question: json['question'] ?? '',
      options: opts,
      correctIndex: json['correct_index'] ?? json['answer'] ?? 0,
      explanation: json['explanation'],
    );
  }
}

// Plan Model
class Plan {
  final int id;
  final String slug;
  final dynamic name; // String or Map (en/ar)
  final double? priceEgp;
  final int? courseLimit; // -1 = unlimited
  final dynamic features; // Map<lang, List<String>>
  final bool isPopular;

  const Plan({
    required this.id,
    required this.slug,
    required this.name,
    this.priceEgp,
    this.courseLimit,
    this.features,
    this.isPopular = false,
  });

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      id: json['id'] ?? 0,
      slug: json['slug'] ?? '',
      name: json['name'],
      priceEgp: (json['price_egp'] as num?)?.toDouble(),
      courseLimit: json['course_limit'],
      features: json['features'],
      isPopular: json['is_popular'] ?? false,
    );
  }

  String getName(String lang) {
    if (name is String) return name;
    if (name is Map) return name[lang] ?? name['en'] ?? slug;
    return slug;
  }

  List<String> getFeatures(String lang) {
    if (features == null) return [];
    if (features is Map) {
      final list = features[lang] ?? features['en'] ?? [];
      return (list as List).map((e) => e.toString()).toList();
    }
    return [];
  }
}

// Personal Note Model
class PersonalNote {
  final int id;
  final int courseId;
  final String content;
  final DateTime? createdAt;

  const PersonalNote({
    required this.id,
    required this.courseId,
    required this.content,
    this.createdAt,
  });

  factory PersonalNote.fromJson(Map<String, dynamic> json) {
    return PersonalNote(
      id: json['id'] ?? 0,
      courseId: json['course_id'] ?? 0,
      content: json['content'] ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
    );
  }
}

// Chat Message Model
class ChatMessage {
  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime? createdAt;

  const ChatMessage({
    required this.role,
    required this.content,
    this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: json['role'] ?? 'user',
      content: json['content'] ?? json['message'] ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
    );
  }

  bool get isUser => role == 'user';
}

// Blog Model
class Blog {
  final int id;
  final String slug;
  final String title;
  final String? excerpt;
  final String? content;
  final String? imageUrl;
  final String? author;
  final DateTime? publishedAt;

  const Blog({
    required this.id,
    required this.slug,
    required this.title,
    this.excerpt,
    this.content,
    this.imageUrl,
    this.author,
    this.publishedAt,
  });

  factory Blog.fromJson(Map<String, dynamic> json) {
    return Blog(
      id: json['id'] ?? 0,
      slug: json['slug'] ?? '',
      title: json['title'] ?? '',
      excerpt: json['excerpt'],
      content: json['content'],
      imageUrl: json['image_url'] ?? json['image'],
      author: json['author'],
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'])
          : null,
    );
  }
}
